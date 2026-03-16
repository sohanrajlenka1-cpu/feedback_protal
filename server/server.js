const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const dataDir = path.join(__dirname, '..', 'data');
const feedbackCsv = path.join(dataDir, 'feedback_institution.csv');
const deptFeedbackCsv = path.join(dataDir, 'feedback_department.csv');
const usersCsv = path.join(dataDir, 'users.csv');

// Ensure CSV files exist with headers
function ensureCsv(file, headers) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, headers + '\n');
}
ensureCsv(usersCsv, 'id,name,email,password,created_at');
ensureCsv(feedbackCsv, 'id,name,email,registration_number,department,academic_year,education_quality,faculty_satisfaction,infrastructure_rating,improvements,comments,submitted_at');
ensureCsv(deptFeedbackCsv, 'id,name,email,registration_number,department,academic_year,education_quality,faculty_satisfaction,labs_rating,department_activities,faculty_bonding,improvements,comments,submitted_at');

function csvEscape(val) {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsv(file) {
    const content = fs.readFileSync(file, 'utf-8').trim();
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = [];
        let current = '', inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
            else { current += ch; }
        }
        values.push(current);
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');
        return obj;
    });
}

function getNextId(file) {
    const rows = parseCsv(file);
    if (!rows.length) return 1;
    return Math.max(...rows.map(r => parseInt(r.id) || 0)) + 1;
}

function appendRow(file, values) {
    const line = values.map(csvEscape).join(',') + '\n';
    fs.appendFileSync(file, line);
}

function hashPassword(pw) {
    return crypto.createHash('sha256').update(pw).digest('hex');
}

// Auth
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    const users = parseCsv(usersCsv);
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    const id = getNextId(usersCsv);
    appendRow(usersCsv, [id, name, email, hashPassword(password), new Date().toISOString()]);
    res.json({ user: { id, name, email } });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = parseCsv(usersCsv);
    const user = users.find(u => u.email === email && u.password === hashPassword(password));
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

// Institution feedback
app.post('/submit-feedback', (req, res) => {
    try {
        const { name, email, registration_number, department, academic_year,
                education_quality, faculty_satisfaction, infrastructure_rating,
                improvements, comments } = req.body;
        const id = getNextId(feedbackCsv);
        appendRow(feedbackCsv, [id, name, email, registration_number, department,
            academic_year, education_quality, faculty_satisfaction, infrastructure_rating,
            improvements, comments, new Date().toISOString()]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Department feedback
app.post('/submit-department-feedback', (req, res) => {
    try {
        const { name, email, registration_number, department, academic_year,
                education_quality, faculty_satisfaction, labs_rating,
                department_activities, faculty_bonding,
                improvements, comments } = req.body;
        const id = getNextId(deptFeedbackCsv);
        appendRow(deptFeedbackCsv, [id, name, email, registration_number, department,
            academic_year, education_quality, faculty_satisfaction, labs_rating,
            department_activities, faculty_bonding, improvements, comments,
            new Date().toISOString()]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => res.redirect('/index.html'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
