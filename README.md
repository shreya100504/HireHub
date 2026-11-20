# HireHub – Job Portal & Recruitment Management System

HireHub is a web-based job portal that connects job seekers with recruiters and helps manage the recruitment process.

## Features

- Role-based authentication for Candidates, Recruiters and Admins
- Candidate profiles and skill management
- Job posting and job approval
- Job search and advanced filters
- Job applications and application status tracking
- Saved jobs
- Interview scheduling
- Notifications
- HireHub SmartMatch – skill-based job recommendations and candidate compatibility scores

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, FastAPI
- **Database:** Microsoft SQL Server
- **ORM:** SQLAlchemy
- **Authentication:** JWT

## Project Structure

```text
HireHub/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── utils/
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── recruiter-dashboard.html
│   ├── admin-dashboard.html
│   ├── app.js
│   └── style.css
├── .gitignore
└── README.md
```

## SmartMatch

SmartMatch compares candidate skills with the required skills of a job.

**Match Score = (Matched Required Skills / Total Required Skills) × 100**

It displays matching percentages, matched skills and missing skills.

The current implementation uses a rule-based matching algorithm.

## Setup

1. Clone the repository.
2. Install Python dependencies.
3. Configure environment variables.
4. Start the FastAPI backend.
5. Open the frontend.

## Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API documentation:

`http://127.0.0.1:8000/docs`

## Environment Variables

Create an `.env` file for the backend configuration.

Do not commit credentials or secrets to GitHub.

## Project Status

Developed as a Job Portal & Recruitment Management System project.