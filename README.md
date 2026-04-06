# Feedback Portal

A web-based feedback portal for students to submit department and institution level feedback.

## Features

- User signup & login
- Department Feedback Form (education quality, labs, faculty bonding, etc.)
- Institution Feedback Form (education quality, faculty, infrastructure, etc.)
- CSV-based data storage (no database required)
- Auto-redirect after successful submission
- Responsive UI with consistent dark theme

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS, JavaScript
- **Storage:** CSV files

## Setup

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## Project Structure

```
feedback-portal/
├── data/                  # CSV data files
├── public/                # Frontend HTML pages
│   ├── index.html         # Login/Signup
│   ├── dashboard.html     # Feedback portal menu
│   ├── department_feedback.html
│   ├── institution_feedback.html
│   └── success.html
├── server/
│   └── server.js          # Express server
└── package.json
```
# Feedback Portal

A web-based feedback portal for students, parents, and administrators to submit and manage department and institution level feedback.

## Features

- User signup & login (Student / Admin roles)
- Department Feedback Form (education quality, labs, faculty bonding, etc.)
- Institution Feedback Form (education quality, faculty, infrastructure, etc.)
- Exit Feedback Form (discipline knowledge, analytical skills, facilities, etc.)
- Parents Feedback Form (teaching, discipline, career guidance, placements, etc.)
- Admin Dashboard with Chart.js analytics (bar, doughnut, horizontal bar charts)
- Per-chart and full-page PDF export
- CSV download for all feedback types
- CSV-based data storage (no database required)
- Auto-redirect after successful submission
- Responsive UI with consistent dark theme

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS, JavaScript
- **Charts:** Chart.js
- **PDF Export:** html2canvas, jsPDF
- **Storage:** CSV files

## Setup

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## Deployment (Render)

1. Push the project to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo and configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Deploy

> **Note:** Render's free tier has an ephemeral filesystem — CSV data resets on each deploy/restart. Use Render Disks or migrate to a database for persistence.

## Changelog

### v1.2 — Parents Feedback Form
- Added `parents_feedback.html` with 6 rating questions (education quality, safety & discipline, communication, infrastructure, overall development, recommendation)
- Added `/submit-parents-feedback` POST API and `/api/feedback/parents/:regNo` GET API
- Added `/api/admin/feedback/parents` admin endpoint and CSV download support
- Added Parents Feedback card to Student Corner page

### v1.1 — Exit Student Feedback Form
- Added `exit_feedback.html` with rating questions (discipline knowledge, analytical skills, capacity building, practical classes, beyond syllabus, team spirit, learning environment, facilities)
- Added `/submit-exit-feedback` POST API and `/api/feedback/exit/:regNo` GET API
- Added `/api/admin/feedback/exit` admin endpoint and CSV download support
- Added Exit Student Feedback card to Student Corner page
- Created `feedback_exit.csv` and `feedback_parents.csv` data files

### v1.0 — Initial Release
- User signup & login (Student / Admin roles)
- Department Feedback Form (education quality, labs, faculty bonding, etc.)
- Institution Feedback Form (education quality, faculty, infrastructure, etc.)
- Admin Dashboard with analytics
- CSV-based data storage
- Student Corner with feedback form selection
- Auto-redirect after successful submission
- Responsive UI with dark theme

## Project Structure

```
feedback-portal/
├── data/                          # CSV data files
│   ├── feedback_department.csv
│   ├── feedback_exit.csv
│   ├── feedback_institution.csv
│   ├── feedback_parents.csv
│   └── users.csv
├── public/                        # Frontend HTML pages
│   ├── images/                    # Static images
│   ├── index.html                 # Login / Signup
│   ├── home.html                  # Student home page
│   ├── admin.html                 # Admin dashboard & analytics
│   ├── department_feedback.html
│   ├── institution_feedback.html
│   ├── exit_feedback.html
│   ├── parents_feedback.html
│   ├── student_corner.html
│   └── success.html
├── server/
│   └── server.js                  # Express server & API routes
├── package.json
└── README.md
```
