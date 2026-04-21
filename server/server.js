const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { initSync, pushChanges } = require('./git-sync');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const dataDir = path.join(__dirname, '..', 'data');
const feedbackCsv = path.join(dataDir, 'feedback_institution.csv');
const deptFeedbackCsv = path.join(dataDir, 'feedback_department.csv');
const exitFeedbackCsv = path.join(dataDir, 'feedback_exit.csv');
const parentsFeedbackCsv = path.join(dataDir, 'feedback_parents.csv');
const usersCsv = path.join(dataDir, 'users.csv');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
initSync();

// Ensure CSV files exist with headers
function ensureCsv(file, headers) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, headers + '\n');
}
ensureCsv(usersCsv, 'S.no,Name,Email,Registration No,role,password,created_at');
ensureCsv(feedbackCsv, 'S.no,Name,Email,Registration No,department,academic_year,education_quality,faculty_satisfaction,infrastructure_rating,improvements,comments,submitted_at');
ensureCsv(deptFeedbackCsv, 'S.no,Name,Email,Registration No,department,academic_year,education_quality,faculty_satisfaction,labs_rating,department_activities,faculty_bonding,improvements,comments,submitted_at');
ensureCsv(exitFeedbackCsv, 'S.no,Name,Email,Registration No,department,year_of_passing,online_admission_process,institution_infrastructure,canteen_facilities,washroom_facilities,library_facilities,hostel_facilities,improvements,placement_facilities,student_graviance,course_curriculum,practical_training,computer_labs,student_centric_activities,student_faculty_bonding,overall_rating,comments,submitted_at');
ensureCsv(parentsFeedbackCsv, 'S.no,Name,Student_name,Email,Registration No,department,academic_year,teaching_learning,students_interaction,academic_facilities,students_discipline,overall_facilities,career_guidance,placement_drive,internship_program,extracurricular_activities,curriculum_satisfaction,comments,submitted_at');

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
    return Math.max(...rows.map(r => parseInt(r['S.no']) || 0)) + 1;
}

function appendRow(file, values) {
    const line = values.map(csvEscape).join(',') + '\n';
    fs.appendFileSync(file, line);
}

function hashPassword(pw) {
    return crypto.createHash('sha256').update(pw).digest('hex');
}

function rewriteCsv(file, rows) {
    const content = fs.readFileSync(file, 'utf-8');
    const headers = content.split(/\r?\n/)[0];
    const lines = rows.map(r => {
        const vals = headers.split(',').map(h => csvEscape(r[h] || ''));
        return vals.join(',');
    });
    fs.writeFileSync(file, headers + '\n' + lines.join('\n') + '\n');
}

// Auth
app.post('/api/signup', (req, res) => {
    const { name, email, registration_no, role, admin_code, password } = req.body;
    if (role === 'admin' && admin_code !== 'GPBBSRIT@2026') {
        return res.status(403).json({ error: 'Invalid admin code' });
    }
    const users = parseCsv(usersCsv);
    if (users.find(u => u.Email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    if (role === 'student') {
        if (!registration_no) return res.status(400).json({ error: 'Registration number is required' });
        if (users.find(u => u['Registration No'] === registration_no)) {
            return res.status(400).json({ error: 'Registration number already registered' });
        }
    }
    const id = getNextId(usersCsv);
    appendRow(usersCsv, [id, name, email, registration_no || '', role, hashPassword(password), new Date().toISOString()]);
    pushChanges('new user signup');
    res.json({ user: { id, name, email, registration_no: registration_no || '', role } });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = parseCsv(usersCsv);
    const user = users.find(u => u.Email === email && u.password === hashPassword(password));
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ user: { id: user['S.no'], name: user.Name, email: user.Email, registration_no: user['Registration No'], role: user.role } });
});

// Get existing feedback
app.post('/api/reset-password', (req, res) => {
    const { email, registration_no, new_password } = req.body;
    if (!email || !registration_no || !new_password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const users = parseCsv(usersCsv);
    const idx = users.findIndex(u => u.Email === email && u['Registration No'] === registration_no);
    if (idx < 0) {
        return res.status(404).json({ error: 'No account found with this email and registration number' });
    }
    users[idx].password = hashPassword(new_password);
    rewriteCsv(usersCsv, users);
    pushChanges('password reset');
    res.json({ status: 'success' });
});

// Get existing feedback (req, res) => {
    const rows = parseCsv(feedbackCsv);
    const existing = rows.find(r => r['Registration No'] === req.params.regNo);
    res.json({ feedback: existing || null });
});

app.get('/api/feedback/department/:regNo', (req, res) => {
    const rows = parseCsv(deptFeedbackCsv);
    const existing = rows.find(r => r['Registration No'] === req.params.regNo);
    res.json({ feedback: existing || null });
});

app.get('/api/feedback/exit/:regNo', (req, res) => {
    const rows = parseCsv(exitFeedbackCsv);
    const existing = rows.find(r => r['Registration No'] === req.params.regNo);
    res.json({ feedback: existing || null });
});

app.get('/api/feedback/parents/:regNo', (req, res) => {
    const rows = parseCsv(parentsFeedbackCsv);
    const existing = rows.find(r => r['Registration No'] === req.params.regNo);
    res.json({ feedback: existing || null });
});

// Institution feedback (upsert)
app.post('/submit-feedback', (req, res) => {
    try {
        const { name, email, registration_number, department, academic_year,
                education_quality, faculty_satisfaction, infrastructure_rating,
                improvements, comments } = req.body;
        const rows = parseCsv(feedbackCsv);
        const idx = rows.findIndex(r => r['Registration No'] === registration_number);
        const now = new Date().toISOString();
        if (idx >= 0) {
            Object.assign(rows[idx], { Name: name, Email: email, 'Registration No': registration_number, department, academic_year,
                education_quality, faculty_satisfaction, infrastructure_rating,
                improvements, comments, submitted_at: now });
            rewriteCsv(feedbackCsv, rows);
        } else {
            const id = getNextId(feedbackCsv);
            appendRow(feedbackCsv, [id, name, email, registration_number, department,
                academic_year, education_quality, faculty_satisfaction, infrastructure_rating,
                improvements, comments, now]);
        }
        pushChanges('institution feedback');
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Department feedback (upsert)
app.post('/submit-department-feedback', (req, res) => {
    try {
        const { name, email, registration_number, department, academic_year,
                education_quality, faculty_satisfaction, labs_rating,
                department_activities, faculty_bonding,
                improvements, comments } = req.body;
        const rows = parseCsv(deptFeedbackCsv);
        const idx = rows.findIndex(r => r['Registration No'] === registration_number);
        const now = new Date().toISOString();
        if (idx >= 0) {
            Object.assign(rows[idx], { Name: name, Email: email, 'Registration No': registration_number, department, academic_year,
                education_quality, faculty_satisfaction, labs_rating,
                department_activities, faculty_bonding, improvements, comments, submitted_at: now });
            rewriteCsv(deptFeedbackCsv, rows);
        } else {
            const id = getNextId(deptFeedbackCsv);
            appendRow(deptFeedbackCsv, [id, name, email, registration_number, department,
                academic_year, education_quality, faculty_satisfaction, labs_rating,
                department_activities, faculty_bonding, improvements, comments, now]);
        }
        pushChanges('department feedback');
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exit feedback (upsert)
app.post('/submit-exit-feedback', (req, res) => {
    try {
        const { name, email, registration_number, department, year_of_passing,
                online_admission_process, institution_infrastructure, canteen_facilities,
                washroom_facilities, library_facilities, hostel_facilities, improvements,
                placement_facilities, student_graviance, course_curriculum,
                practical_training, computer_labs, student_centric_activities,
                student_faculty_bonding, overall_rating, comments } = req.body;
        const rows = parseCsv(exitFeedbackCsv);
        const idx = rows.findIndex(r => r['Registration No'] === registration_number);
        const now = new Date().toISOString();
        if (idx >= 0) {
            Object.assign(rows[idx], { Name: name, Email: email, 'Registration No': registration_number, department, year_of_passing,
                online_admission_process, institution_infrastructure, canteen_facilities,
                washroom_facilities, library_facilities, hostel_facilities, improvements,
                placement_facilities, student_graviance, course_curriculum,
                practical_training, computer_labs, student_centric_activities,
                student_faculty_bonding, overall_rating, comments, submitted_at: now });
            rewriteCsv(exitFeedbackCsv, rows);
        } else {
            const id = getNextId(exitFeedbackCsv);
            appendRow(exitFeedbackCsv, [id, name, email, registration_number, department,
                year_of_passing, online_admission_process, institution_infrastructure, canteen_facilities,
                washroom_facilities, library_facilities, hostel_facilities, improvements,
                placement_facilities, student_graviance, course_curriculum,
                practical_training, computer_labs, student_centric_activities,
                student_faculty_bonding, overall_rating, comments, now]);
        }
        pushChanges('exit feedback');
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Parents feedback (upsert)
app.post('/submit-parents-feedback', (req, res) => {
    try {
        const { name, student_name, email, registration_number, department, academic_year,
                teaching_learning, students_interaction, academic_facilities,
                students_discipline, overall_facilities, career_guidance,
                placement_drive, internship_program, extracurricular_activities,
                curriculum_satisfaction, comments } = req.body;
        const rows = parseCsv(parentsFeedbackCsv);
        const idx = rows.findIndex(r => r['Registration No'] === registration_number);
        const now = new Date().toISOString();
        if (idx >= 0) {
            Object.assign(rows[idx], { Name: name, Student_name: student_name, Email: email, 'Registration No': registration_number, department, academic_year,
                teaching_learning, students_interaction, academic_facilities,
                students_discipline, overall_facilities, career_guidance,
                placement_drive, internship_program, extracurricular_activities,
                curriculum_satisfaction, comments, submitted_at: now });
            rewriteCsv(parentsFeedbackCsv, rows);
        } else {
            const id = getNextId(parentsFeedbackCsv);
            appendRow(parentsFeedbackCsv, [id, name, student_name, email, registration_number, department,
                academic_year, teaching_learning, students_interaction, academic_facilities,
                students_discipline, overall_facilities, career_guidance,
                placement_drive, internship_program, extracurricular_activities,
                curriculum_satisfaction, comments, now]);
        }
        pushChanges('parents feedback');
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin APIs
app.get('/api/admin/feedback/institution', (req, res) => {
    res.json({ data: parseCsv(feedbackCsv) });
});

app.get('/api/admin/feedback/department', (req, res) => {
    res.json({ data: parseCsv(deptFeedbackCsv) });
});

app.get('/api/admin/feedback/exit', (req, res) => {
    res.json({ data: parseCsv(exitFeedbackCsv) });
});

app.get('/api/admin/feedback/parents', (req, res) => {
    res.json({ data: parseCsv(parentsFeedbackCsv) });
});

app.get('/api/admin/download/:type', (req, res) => {
    const files = { department: deptFeedbackCsv, institution: feedbackCsv, exit: exitFeedbackCsv, parents: parentsFeedbackCsv };
    const file = files[req.params.type] || feedbackCsv;
    res.download(file, `feedback_${req.params.type}.csv`);
});

app.get('/', (req, res) => res.redirect('/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
