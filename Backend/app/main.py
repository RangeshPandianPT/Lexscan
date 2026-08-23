from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from sqlalchemy import func

from . import models, schemas, database, auth, worker

# Create tables if not exists
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="LexScan API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSockets Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def read_root():
    return {"message": "Welcome to LexScan API v2.0"}

# --- Auth ---
@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Admin Routes ---
@app.get("/admin/rules", response_model=List[schemas.RuleResponse])
def get_rules(db: Session = Depends(database.get_db)):
    return db.query(models.Rule).all()

@app.post("/admin/rules/{rule_id}", response_model=schemas.RuleResponse)
def update_rule(rule_id: str, rule_in: schemas.RuleBase, db: Session = Depends(database.get_db)):
    rule = db.query(models.Rule).filter(models.Rule.id == rule_id).first()
    if not rule:
        rule = models.Rule(id=rule_id, **rule_in.model_dump())
        db.add(rule)
    else:
        for key, value in rule_in.model_dump().items():
            setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule

import subprocess
import os
import glob
import json

@app.post("/admin/scan/trigger", response_model=schemas.ProductScanResponse)
async def trigger_scan(request: schemas.ScanTriggerRequest, db: Session = Depends(database.get_db)):
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(app_dir)
    project_root = os.path.dirname(backend_dir)
    
    # 1. Run Crawler
    crawler_script = os.path.join(project_root, "crawler", "main.py")
    crawler_out_dir = os.path.join(project_root, "crawler", "output")
    crawler_images_dir = os.path.join(crawler_out_dir, "images")
    
    os.makedirs(crawler_out_dir, exist_ok=True)
    os.makedirs(crawler_images_dir, exist_ok=True)
    
    crawler_python = os.path.join(project_root, "crawler", "venv", "bin", "python")
    crawler_cmd = [
        crawler_python, crawler_script, 
        "--url", request.url, 
        "--output-dir", crawler_out_dir,
        "--images-dir", crawler_images_dir
    ]
    
    try:
        subprocess.run(crawler_cmd, check=True, cwd=project_root)
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Crawler failed. E-commerce site may have blocked the request.")
        
    # Find newest JSON in crawler/output
    json_files = glob.glob(os.path.join(crawler_out_dir, "*.json"))
    if not json_files:
        raise HTTPException(status_code=500, detail="Crawler succeeded but produced no JSON output.")
        
    latest_json = max(json_files, key=os.path.getctime)
    
    # 2. Run AI Pipeline
    pipeline_script = os.path.join(project_root, "ai-pipeline", "main.py")
    pipeline_out_dir = os.path.join(project_root, "ai-pipeline", "output")
    os.makedirs(pipeline_out_dir, exist_ok=True)
    
    pipeline_python = os.path.join(project_root, "ai-pipeline", "venv", "bin", "python")
    pipeline_cmd = [pipeline_python, pipeline_script, "--input", latest_json, "--output", pipeline_out_dir]
    try:
        subprocess.run(pipeline_cmd, check=True, cwd=project_root)
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="AI Pipeline OCR/NLP failed to process the image.")
        
    # Read final output
    final_json_path = os.path.join(pipeline_out_dir, os.path.basename(latest_json))
    if not os.path.exists(final_json_path):
        raise HTTPException(status_code=500, detail="AI Pipeline succeeded but final JSON missing.")
        
    with open(final_json_path, "r", encoding="utf-8") as f:
        scan_data = json.load(f)
        
    # The AI pipeline outputs full violation dictionaries in 'violation_details'
    # but the backend Pydantic schema expects them in 'violations'
    if "violation_details" in scan_data:
        scan_data["violations"] = scan_data["violation_details"]
        
    scan_in = schemas.ProductScanCreate(**scan_data)
    
    # Overwrite if exists
    existing = db.query(models.ProductScan).filter(models.ProductScan.product_id == scan_in.product_id).first()
    if existing:
        db.delete(existing)
        db.flush()
        
    # Ingest using existing function
    return ingest_product_scan(scan_in, db)

# --- Products & Scans ---
@app.get("/products", response_model=List[schemas.ProductScanResponse])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    status: Optional[str] = None,
    platform: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.ProductScan)
    if status:
        query = query.filter(models.ProductScan.status == status)
    if platform:
        query = query.filter(models.ProductScan.platform == platform)
    if category:
        query = query.filter(models.ProductScan.category == category)
    
    return query.order_by(models.ProductScan.timestamp.desc()).offset(skip).limit(limit).all()

@app.get("/products/{scan_id}", response_model=schemas.ProductScanResponse)
def get_product(scan_id: str, db: Session = Depends(database.get_db)):
    scan = db.query(models.ProductScan).filter(
        (models.ProductScan.id == scan_id) | (models.ProductScan.product_id == scan_id)
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@app.get("/violations", response_model=List[schemas.ViolationResponse])
def get_violations(
    severity: Optional[str] = None,
    platform: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Violation)
    if severity:
        query = query.filter(models.Violation.severity == severity)
    if platform:
        query = query.join(models.ProductScan).filter(models.ProductScan.platform == platform)
    return query.offset(skip).limit(limit).all()

@app.get("/violations/summary")
def get_violations_summary(db: Session = Depends(database.get_db)):
    total_scanned = db.query(models.ProductScan).count()
    total_violations = db.query(models.Violation).count()
    high_severity = db.query(models.Violation).filter(models.Violation.severity == "HIGH").count()
    
    # Violation counts grouped by rule_id / issue
    issue_counts = db.query(
        models.Violation.issue, func.count(models.Violation.id)
    ).group_by(models.Violation.issue).all()

    return {
        "total_scanned": total_scanned,
        "total_violations": total_violations,
        "high_severity": high_severity,
        "by_issue": [{"issue": issue or "Unknown", "count": count} for issue, count in issue_counts]
    }

@app.post("/products/ingest", response_model=schemas.ProductScanResponse, status_code=status.HTTP_201_CREATED)
def ingest_product_scan(scan_in: schemas.ProductScanCreate, db: Session = Depends(database.get_db)):
    # Create main scan
    db_scan = models.ProductScan(
        product_id=scan_in.product_id,
        platform=scan_in.platform,
        url=scan_in.url,
        title=scan_in.title,
        category=scan_in.category,
        seller_id=scan_in.seller_id,
        scraped_at=scan_in.scraped_at,
        raw_html_sha256=scan_in.raw_html_sha256,
        images=scan_in.images,
        extracted_fields=scan_in.extracted_fields,
        listing_price=scan_in.listing_price,
        compliance_score=scan_in.compliance_score,
        exemption_status=scan_in.exemption_status,
        status=scan_in.status or ("COMPLIANT" if scan_in.compliance_score >= 80 else "NON_COMPLIANT")
    )
    db.add(db_scan)
    db.flush()
    
    # Add violations
    for v in scan_in.violations:
        db_v = models.Violation(
            violation_id=v.violation_id,
            product_id=v.product_id or db_scan.product_id,
            rule_id=v.rule_id,
            clause=v.clause,
            issue=v.issue,
            severity=v.severity,
            message=v.message,
            confidence=v.confidence,
            bounding_box=v.bounding_box,
            detected_at=v.detected_at,
            scan_id=db_scan.id
        )
        db.add(db_v)
        
    db.commit()
    db.refresh(db_scan)
    return db_scan

@app.get("/sellers")
def get_sellers(db: Session = Depends(database.get_db)):
    scans = db.query(models.ProductScan).all()
    
    stats = {
        "amazon": {"seller_id": "SEL-AMZ-001", "seller_name": "SuperRetail India", "platform": "amazon", "total_listings_scanned": 0, "total_violations": 0, "state": "Maharashtra"},
        "flipkart": {"seller_id": "SEL-FLP-002", "seller_name": "MegaMart E-com", "platform": "flipkart", "total_listings_scanned": 0, "total_violations": 0, "state": "Karnataka"},
        "meesho": {"seller_id": "SEL-MSH-003", "seller_name": "QuickBuy Store", "platform": "meesho", "total_listings_scanned": 0, "total_violations": 0, "state": "Delhi"}
    }
    
    for scan in scans:
        plat = (scan.platform or "other").lower()
        if plat in stats:
            stats[plat]["total_listings_scanned"] += 1
            if scan.status == "NON_COMPLIANT":
                stats[plat]["total_violations"] += 1
                
    result = []
    for p in ["amazon", "flipkart", "meesho"]:
        data = stats[p]
        scanned = data["total_listings_scanned"]
        violations = data["total_violations"]
        data["compliance_rate"] = round(((scanned - violations) / scanned * 100), 1) if scanned > 0 else 100.0
        result.append(data)
        
    return result

@app.get("/geo/heatmap")
def get_geo_heatmap():
    return [
        {"lat": 28.6139, "lng": 77.2090, "weight": 0.8, "state": "Delhi", "violations": 120},
        {"lat": 19.0760, "lng": 72.8777, "weight": 0.9, "state": "Maharashtra", "violations": 240},
        {"lat": 12.9716, "lng": 77.5946, "weight": 0.5, "state": "Karnataka", "violations": 85},
        {"lat": 13.0827, "lng": 80.2707, "weight": 0.6, "state": "Tamil Nadu", "violations": 98},
    ]
