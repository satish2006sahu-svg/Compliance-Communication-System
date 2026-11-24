import sys
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings, BASE_DIR
from app.database import Base, engine
from app.routes import auth, admin, employee, system
from app.seed import seed_users

# Create SQLite database tables
Base.metadata.create_all(bind=engine)

# Seed default administrator and employee accounts on startup
try:
    seed_users()
except Exception as e:
    print(f"Warning during seed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="End-to-End AI-Powered Regulatory Compliance Communication System with Firecrawl and Memento Memory"
)

# Enable CORS (support configured origins and local development)
cors_origins = settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if "*" not in cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(employee.router, prefix=settings.API_PREFIX)
app.include_router(system.router, prefix=settings.API_PREFIX)

# Healthcheck endpoints for container/orchestrator monitoring
@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Check if production frontend build exists (frontend/dist)
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    # Mount built static assets
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static_assets")

    # Serve index.html on root
    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    # Catch-all route for SPA client-side routing
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        # Never intercept API, Docs, or Health routes
        if (
            full_path.startswith("api") 
            or full_path.startswith("docs") 
            or full_path.startswith("openapi.json")
            or full_path.startswith("health")
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        # If a specific static file in dist is requested (e.g. favicon.svg, icons.svg)
        static_file = FRONTEND_DIST / full_path
        if static_file.is_file():
            return FileResponse(static_file)

        # Fallback to index.html for React routing
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    # Development API information fallback
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "api_prefix": settings.API_PREFIX
        }
