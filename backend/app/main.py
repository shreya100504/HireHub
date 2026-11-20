from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routes import smartmatch

from app.routes.auth import router as auth_router
from app.routes.candidate import router as candidate_router
from app.routes.company import router as company_router
from app.routes.job import router as job_router
from app.routes.admin import router as admin_router
from app.routes import auth
from app.routes import company
from app.routes import admin
from app.routes import applications
from app.routes import interviews
from app.routes import notifications

from app.models import (
    user,
    candidate_profile,
    company,
    job,
    application,
    interview,
    saved_job,
    notification,
    audit_log
)
from app import database


# =====================================================
# UPLOAD DIRECTORY
# =====================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

UPLOAD_DIR = PROJECT_ROOT / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="HireHub - A Job Portal & Recruitment Management System",
    description="Backend API for a Job Portal and Recruitment Management System",
    version="1.0.0"
)

# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROUTES
# =====================================================

app.include_router(auth_router)
app.include_router(candidate_router)
app.include_router(company_router)
app.include_router(job_router)
app.include_router(admin.router)
app.include_router(applications.router)
app.include_router(interviews.router)
app.include_router(notifications.router)
app.include_router(smartmatch.router)

# =====================================================
# STATIC UPLOADS
# =====================================================

app.mount(
    "/uploads",
    StaticFiles(
        directory=str(UPLOAD_DIR)
    ),
    name="uploads"
)

# =====================================================
# CREATE DATABASE TABLES
# =====================================================

database.Base.metadata.create_all(bind=database.engine)

# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():
    return {
        "message": "Job Portal API is running"
    }