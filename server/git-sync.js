const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const GIT_REPO = process.env.GIT_REPO_URL;

function run(cmd, cwd = dataDir) {
    try {
        return execSync(cmd, { cwd, stdio: 'pipe', timeout: 30000 }).toString().trim();
    } catch (e) {
        console.error(`git-sync error: ${cmd}`, e.message);
        return null;
    }
}

function initSync() {
    if (!GIT_REPO) {
        console.log('GIT_REPO_URL not set — local CSV storage only');
        return;
    }
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    if (!fs.existsSync(path.join(dataDir, '.git'))) {
        run(`git clone ${GIT_REPO} data`, path.join(__dirname, '..'));
        console.log('git-sync: cloned data repo');
    } else {
        run('git pull --rebase origin main');
        console.log('git-sync: pulled latest');
    }
    run('git config user.email "bot@feedback-portal"');
    run('git config user.name "Feedback Bot"');
}

function pushChanges(msg = 'auto-sync data') {
    if (!GIT_REPO) return;
    run('git add -A');
    if (!run('git status --porcelain')) return;
    run(`git commit -m "${msg}"`);
    run('git push origin main');
}

module.exports = { initSync, pushChanges };
