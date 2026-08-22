import random
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
            models.Rule(id="LM-R06-MRP-FORMAT", description="MRP must be properly formatted including taxes", config={"pattern": "MRP.*inclusive"}),
            models.Rule(id="LM-R07-NET-QTY", description="Net quantity must use standard units", config={"valid_units": ["g", "kg", "ml", "l"]}),
            models.Rule(id="LM-R08-MFG-ADDR", description="Manufacturer must include PIN code", config={"require_pin": True}),
            models.Rule(id="FONT_SIZE_MRP", description="MRP font size must meet area threshold", config={"thresholds": {"100": 1, "500": 2, "2500": 4}})
        ]
        db.add_all(rules)
        
        # 3. Seed Scans
        statuses = ["COMPLIANT", "NON_COMPLIANT"]
        modes = ["live", "ecommerce"]
        
        for i in range(50):
            status = random.choice(statuses)
            mode = random.choice(modes)
            score = random.uniform(50, 100) if status == "COMPLIANT" else random.uniform(10, 49)
            
            scan = models.ProductScan(
                scan_mode=mode,
                compliance_score=round(score, 2),
                status=status,
                extracted_fields={
                    "mrp": "399",
                    "net_quantity": "500 g",
                    "manufacturer": "Test Corp, 123 Industrial Area, PIN 110001",
                    "mfg_date": "01/2026"
                },
                exemption_status={"exempted": False, "reason": None}
            )
            
            db.add(scan)
            db.flush()
            
            if status == "NON_COMPLIANT":
                num_violations = random.randint(1, 3)
                for _ in range(num_violations):
                    violation = models.Violation(
                        scan_id=scan.id,
                        rule_id=random.choice(["LM-R06-MRP-FORMAT", "LM-R07-NET-QTY", "LM-R08-MFG-ADDR"]),
                        severity=random.choice(["HIGH", "MEDIUM", "LOW"]),
                        description="Test violation description",
                        observed_value="Test observed",
                        expected_value="Test expected",
                        confidence=round(random.uniform(0.7, 0.99), 2)
                    )
                    db.add(violation)
                    
            # Add some font checks
            font_check = models.FontCheck(
                scan_id=scan.id,
                field_name="MRP",
                estimated_size_mm=round(random.uniform(1.0, 5.0), 2),
                minimum_required_mm=4.0,
                status=random.choice(["PASS", "FAIL"])
            )
            db.add(font_check)
            
            # Add format checks
            format_check_status = random.choice(["VALID", "INVALID"])
            format_check = models.FormatCheck(
                scan_id=scan.id,
                field_name="Net Quantity",
                status=format_check_status,
                reason="Invalid unit format" if format_check_status == "INVALID" else None
            )
            db.add(format_check)
            
        db.commit()
        print("Successfully seeded 50 product scans.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
