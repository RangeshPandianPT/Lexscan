import random
from datetime import datetime
from app.database import engine, SessionLocal
from app import models, auth

def clear_db():
    print("Dropping and recreating tables...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    try:
        clear_db()
        
        # 1. Seed Admin User
        admin_user = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin"),
            is_admin=True
        )
        db.add(admin_user)
        
        # 2. Seed Default Rules
        rules = [
            models.Rule(id="LM-R06-MRP-01", rule_name="Mandatory MRP Declaration", act_reference="Legal Metrology Rules, 2011 - Rule 6(1)(e)", category="ALL", field="mrp", check="not_null_and_positive", severity="HIGH", description="MRP missing or not positive"),
            models.Rule(id="LM-R06-MRP-FORMAT", rule_name="MRP Format Compliance", act_reference="Legal Metrology Rules, 2011 - Rule 6(1)(e)", category="ALL", field="mrp", check="regex_match", severity="MEDIUM", description="MRP formatting must explicitly state inclusive of all taxes"),
            models.Rule(id="LM-R06-ORIGIN-01", rule_name="Country of Origin Declaration", act_reference="Legal Metrology Rules, 2011 - Rule 6(1)(n)", category="ALL", field="country_of_origin", check="not_null", severity="HIGH", description="Country of origin mandatory"),
            models.Rule(id="LM-R06-FONT-MRP", rule_name="Font Size Validation", act_reference="Legal Metrology Rules, 2011 - Rule 9", category="ALL", field="mrp", check="font_size_compliance", severity="HIGH", description="Numeral font height must meet minimum threshold")
        ]
        db.add_all(rules)
        
        # 3. Seed Scans & Violations
        platforms = ["amazon", "flipkart", "meesho"]
        categories = ["cosmetics", "packaged_food", "electronics", "baby_care", "other"]
        sellers = [
            ("SEL-AMZ-001", "SuperRetail India"),
            ("SEL-FLP-002", "MegaMart E-com"),
            ("SEL-MSH-003", "QuickBuy Store")
        ]
        issues_list = [
            ("LM-R06-MRP-01", "MANDATORY_MRP_MISSING", "HIGH", "Rule 6(1)(e), PC Rules 2011", "Mandatory MRP declaration is missing."),
            ("LM-R06-MRP-FORMAT", "PRICE_ABOVE_MRP", "HIGH", "Rule 6(1)(e), PC Rules 2011", "Listed price exceeds stamped MRP."),
            ("LM-R06-ORIGIN-01", "MISSING_ORIGIN", "MEDIUM", "Rule 6(1)(n), PC Rules 2011", "Country of origin is not declared."),
            ("LM-R06-FONT-MRP", "SUB_MINIMUM_FONT_SIZE", "HIGH", "Rule 9, PC Rules 2011", "Font height of MRP numeral (1.5mm) is below required minimum (3.0mm).")
        ]
        
        for i in range(50):
            platform = random.choice(platforms)
            category = random.choice(categories)
            seller_id, seller_name = random.choice(sellers)
            is_compliant = random.choice([True, False])
            score = random.uniform(80, 100) if is_compliant else random.uniform(20, 75)
            status = "COMPLIANT" if is_compliant else "NON_COMPLIANT"
            product_id = f"{platform.upper()[:3]}-IN-B09XYZ{100+i}"
            
            scan = models.ProductScan(
                product_id=product_id,
                platform=platform,
                url=f"https://{platform}.in/dp/B09XYZ{100+i}",
                title=f"Sample Product {i+1} ({category.replace('_', ' ').title()})",
                category=category,
                seller_id=seller_id,
                scraped_at=datetime.utcnow().isoformat(),
                raw_html_sha256="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
                images=[{"url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f", "sha256": "123456"}],
                extracted_fields={
                    "mrp": {"value": round(random.uniform(100, 1500), 2), "currency": "INR", "confidence": round(random.uniform(0.8, 0.99), 2)},
                    "net_quantity": {"value": "500g", "confidence": round(random.uniform(0.85, 0.98), 2)},
                    "manufacturer": {"value": "XYZ Consumer Products Ltd", "confidence": 0.91},
                    "country_of_origin": {"value": "India", "confidence": 0.88}
                },
                listing_price=round(random.uniform(100, 1500), 2),
                compliance_score=round(score, 1),
                exemption_status={"exempted": False, "reason": None},
                status=status
            )
            
            db.add(scan)
            db.flush()
            
            if not is_compliant:
                num_violations = random.randint(1, 2)
                selected_issues = random.sample(issues_list, num_violations)
                for r_id, issue_type, sev, clause, msg in selected_issues:
                    violation = models.Violation(
                        violation_id=f"VIO-20260822-000{random.randint(100, 999)}",
                        scan_id=scan.id,
                        product_id=product_id,
                        rule_id=r_id,
                        clause=clause,
                        issue=issue_type,
                        severity=sev,
                        message=msg,
                        confidence=round(random.uniform(0.8, 0.98), 2),
                        bounding_box={"ymin": 120, "xmin": 40, "ymax": 210, "xmax": 380},
                        detected_at=datetime.utcnow().isoformat()
                    )
                    db.add(violation)
                    
        db.commit()
        print("Successfully seeded 50 PLAN-2.md compliant product scans.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
