import asyncio
import os
import subprocess
import glob
import json
import httpx
from datetime import datetime

import argparse

# Set up paths
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
crawler_dir = os.path.join(project_root, "crawler")
pipeline_dir = os.path.join(project_root, "ai-pipeline")

def run_cmd(cmd, cwd):
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, cwd=cwd)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-name", type=str, default="BigBasket Dataset 2026")
    parser.add_argument("--limit", type=str, default="10")
    parser.add_argument("--csv-path", type=str, default="kaggle_fallback/bigbasket_dataset.csv")
    args = parser.parse_args()

    print("🚀 Starting Bulk Ingestion Pipeline")
    
    # 1. Generate Seed Catalog (crawler)
    print("\n--- Step 1: Generating Raw JSONs (Crawler Seed) ---")
    run_cmd(["python", "main.py", "--kaggle", "--csv-path", args.csv_path, "--dataset-name", args.dataset_name, "--limit", args.limit], cwd=crawler_dir)
    
    # 2. Run AI Pipeline in Batch Mode
    print("\n--- Step 2: Processing via AI Pipeline (OCR & Rules) ---")
    crawler_output = os.path.join(crawler_dir, "output")
    pipeline_output = os.path.join(pipeline_dir, "output")
    os.makedirs(pipeline_output, exist_ok=True)
    
    pipeline_python = os.path.join(pipeline_dir, "venv", "bin", "python")
    run_cmd([pipeline_python, "main.py", "--batch", crawler_output, "--output", pipeline_output, "--fast"], cwd=pipeline_dir)
    
    # 3. Ingest into Database via API
    print("\n--- Step 3: Pushing Processed Scans to Database ---")
    json_files = glob.glob(os.path.join(pipeline_output, "*.json"))
    
    if not json_files:
        print("❌ No processed JSON files found in ai-pipeline/output!")
        return
        
    print(f"Found {len(json_files)} processed products. Sending to Backend API...")
    
    success_count = 0
    with httpx.Client(timeout=30.0) as client:
        for file_path in json_files:
            with open(file_path, "r", encoding="utf-8") as f:
                scan_data = json.load(f)
                
            # Map 'violation_details' to 'violations' for Pydantic schema
            if "violation_details" in scan_data:
                scan_data["violations"] = scan_data["violation_details"]
                
            try:
                # Assuming backend is running locally on port 8000
                res = client.post("http://127.0.0.1:8000/products/ingest", json=scan_data)
                res.raise_for_status()
                success_count += 1
                print(f"✅ Ingested: {scan_data.get('title', 'Unknown')[:50]}...")
            except Exception as e:
                print(f"❌ Failed to ingest {os.path.basename(file_path)}: {e}")
                
    print(f"\n🎉 Bulk Ingestion Complete! Successfully ingested {success_count}/{len(json_files)} products.")

if __name__ == "__main__":
    main()
