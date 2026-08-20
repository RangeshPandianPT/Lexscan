from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.v1 import products, violations, sellers, geo, auth, admin
from app.core.config import settings
from app.db.database import engine, Base

# --- Socket.IO Setup ---
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

# --- FastAPI App ---
app = FastAPI(
    title="LexScan API",
    description="Legal Metrology Compliance Monitoring Platform — SIH PS 25057",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount Socket.IO at /ws ---
app.mount("/ws", socket_app)

# --- Include Routers ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(violations.router, prefix="/api/v1/violations", tags=["Violations"])
app.include_router(sellers.router, prefix="/api/v1/sellers", tags=["Sellers"])
app.include_router(geo.router, prefix="/api/v1/geo", tags=["Geo / Heatmap"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "LexScan API is running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
