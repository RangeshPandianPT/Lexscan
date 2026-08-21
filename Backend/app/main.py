from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

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
def get_rules(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    return db.query(models.Rule).all()

@app.post("/admin/rules/{rule_id}", response_model=schemas.RuleResponse)
def update_rule(rule_id: str, rule_in: schemas.RuleBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
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

@app.post("/admin/scan/trigger")
def trigger_scan(scan_type: str, scan_id: str, image_path: str, current_user: models.User = Depends(auth.get_current_active_admin)):
    # Trigger a Celery task for background AI processing
    task = worker.run_ai_scan.delay(scan_id=scan_id, image_path=image_path)
    return {"message": f"Scan of type {scan_type} triggered successfully", "job_id": task.id}

# --- Products & Scans ---
@app.get("/products", response_model=List[schemas.ProductScanResponse])
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    status: Optional[str] = None,
    scan_mode: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.ProductScan)
    if status:
        query = query.filter(models.ProductScan.status == status)
    if scan_mode:
        query = query.filter(models.ProductScan.scan_mode == scan_mode)
    
    return query.order_by(models.ProductScan.timestamp.desc()).offset(skip).limit(limit).all()

@app.get("/products/{scan_id}", response_model=schemas.ProductScanResponse)
def get_product(scan_id: str, db: Session = Depends(database.get_db)):
    scan = db.query(models.ProductScan).filter(models.ProductScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@app.get("/violations", response_model=List[schemas.ViolationResponse])
def get_violations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    violations = db.query(models.Violation).offset(skip).limit(limit).all()
    return violations

@app.post("/products/ingest", response_model=schemas.ProductScanResponse, status_code=status.HTTP_201_CREATED)
def ingest_product_scan(scan_in: schemas.ProductScanCreate, db: Session = Depends(database.get_db)):
    # Create main scan
    db_scan = models.ProductScan(
        scan_mode=scan_in.scan_mode,
        compliance_score=scan_in.compliance_score,
        status=scan_in.status,
        evidence_image_url=scan_in.evidence_image_url,
        evidence_hash=scan_in.evidence_hash,
        extracted_fields=scan_in.extracted_fields,
        exemption_status=scan_in.exemption_status
    )
    db.add(db_scan)
    db.flush() # flush to get the id
    
    # Add violations
    for v in scan_in.violations:
        db_v = models.Violation(**v.model_dump(), scan_id=db_scan.id)
        db.add(db_v)
        
    # Add font checks
    for fc in scan_in.font_checks:
        db_fc = models.FontCheck(**fc.model_dump(), scan_id=db_scan.id)
        db.add(db_fc)
        
    # Add format checks
    for frm in scan_in.format_checks:
        db_frm = models.FormatCheck(**frm.model_dump(), scan_id=db_scan.id)
        db.add(db_frm)
        
    db.commit()
    db.refresh(db_scan)
    
    # Optional: We would broadcast this new scan async, 
    # but since this is synchronous, it requires an async wrapper or queue in a real setup.
    # In a full Celery setup, the worker would broadcast this via Redis PubSub to the Uvicorn workers.
    
    return db_scan

@app.get("/sellers")
def get_sellers():
    # Mock data for sellers
    return [
        {"id": 1, "name": "SuperRetail India", "platform": "Amazon", "compliance_score": 85, "total_scans": 120},
        {"id": 2, "name": "MegaMart E-com", "platform": "Flipkart", "compliance_score": 42, "total_scans": 55},
        {"id": 3, "name": "QuickBuy Store", "platform": "Amazon", "compliance_score": 91, "total_scans": 310}
    ]

@app.get("/geo/heatmap")
def get_geo_heatmap():
    # Mock data for geo heatmap (lat, lng, weight)
    return [
        {"lat": 28.6139, "lng": 77.2090, "weight": 0.8}, # Delhi
        {"lat": 19.0760, "lng": 72.8777, "weight": 0.9}, # Mumbai
        {"lat": 12.9716, "lng": 77.5946, "weight": 0.5}, # Bangalore
        {"lat": 13.0827, "lng": 80.2707, "weight": 0.6}, # Chennai
    ]

