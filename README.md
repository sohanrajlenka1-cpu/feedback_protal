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
