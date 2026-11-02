/* =====================================================
   HealthQ — Digital Queue Management System
   app.js — All application logic
   ===================================================== */

'use strict';

// ─── ROLE / AUTH ─────────────────────────────────────
const ADMIN_PIN = 'admin123';
let currentRole = null; // 'user' | 'admin'

function selectRole(role) {
  // Clear previous selection styling
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  const pinSection = document.getElementById('admin-pin-section');
  document.getElementById('pin-error').textContent = '';

  if (role === 'admin') {
    document.getElementById('role-admin-btn').classList.add('selected');
    pinSection.classList.add('visible');
    setTimeout(() => document.getElementById('admin-pin-input').focus(), 100);
  } else {
    document.getElementById('role-user-btn').classList.add('selected');
    pinSection.classList.remove('visible');
    enterApp('user');
  }
}

function confirmAdminPin() {
  const pin = document.getElementById('admin-pin-input').value;
  const errEl = document.getElementById('pin-error');
  if (pin === ADMIN_PIN) {
    errEl.textContent = '';
    enterApp('admin');
  } else {
    errEl.textContent = '❌ Incorrect PIN. Please try again.';
    document.getElementById('admin-pin-input').value = '';
    document.getElementById('admin-pin-input').focus();
  }
}

function enterApp(role) {
  currentRole = role;
  // Hide login, show app shell
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';
  applyRole(role);
  seedDemo();
  if (role === 'admin') {
    showPage('dashboard');
  } else {
    showPage('register');
  }
  refreshAll();
}

function applyRole(role) {
  const isAdmin = role === 'admin';
  // Nav items
  document.querySelectorAll('.nav-item.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  // Role badge in topbar
  const badge = document.getElementById('role-badge');
  if (isAdmin) {
    badge.innerHTML = `<span class="role-badge-pill admin">⚙ Admin</span>`;
  } else {
    badge.innerHTML = `<span class="role-badge-pill user">👤 Patient</span>`;
  }
}

function logout() {
  currentRole = null;
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('login-screen').style.display = '';
  // Reset PIN field & error
  document.getElementById('admin-pin-input').value = '';
  document.getElementById('pin-error').textContent = '';
  document.getElementById('admin-pin-section').classList.remove('visible');
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
}

// ─── STATE ───────────────────────────────────────────
let patients = JSON.parse(localStorage.getItem('hq_patients') || '[]');
let counters = JSON.parse(localStorage.getItem('hq_counters') || 'null') || [
  { id: 1, name: 'Counter 1', doctor: 'Dr. A. Sharma', dept: 'General Medicine', status: 'active', serving: null },
  { id: 2, name: 'Counter 2', doctor: 'Dr. P. Nair',   dept: 'Pediatrics',       status: 'active', serving: null },
  { id: 3, name: 'Counter 3', doctor: 'Dr. S. Rao',    dept: 'Eye Care',         status: 'break',  serving: null },
  { id: 4, name: 'Counter 4', doctor: 'Dr. M. Khan',   dept: 'Dental',           status: 'active', serving: null },
];
let tokenCounter = parseInt(localStorage.getItem('hq_token_ctr') || '0');
let currentPage = 'dashboard';
let apptFilter  = 'today';
let editCounterId = null;

// ─── PERSIST ─────────────────────────────────────────
function save() {
  localStorage.setItem('hq_patients', JSON.stringify(patients));
  localStorage.setItem('hq_counters', JSON.stringify(counters));
  localStorage.setItem('hq_token_ctr', tokenCounter);
}

// ─── NAVIGATION ──────────────────────────────────────
function showPage(name) {
  // Block user from accessing admin-only pages
  const adminPages = ['dashboard','queue','appointments','doctors','reports'];
  if (currentRole === 'user' && adminPages.includes(name)) {
    showToast('⚠ Access denied. Admin only.', 'error');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  const nv = document.getElementById('nav-' + name);
  if (pg) pg.classList.add('active');
  if (nv) nv.classList.add('active');
  currentPage = name;

  const titles = {
    dashboard:    ['Dashboard', 'City Health Camp — Live Overview'],
    register:     ['Register Patient', 'Generate Token & Book Appointment'],
    queue:        ['Live Queue', 'Real-time Patient Queue Management'],
    display:      ['Token Display Board', 'Public Kiosk View'],
    appointments: ['Appointments', 'Scheduled Patient Appointments'],
    doctors:      ['Doctors & Counters', 'Manage Counters & Staff'],
    reports:      ['Reports', 'Analytics & Camp Summary'],
  };
  const [title, sub] = titles[name] || ['HealthQ', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = sub;

  refreshAll();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── CLOCK ───────────────────────────────────────────
function tickClock() {
  const now = new Date();
  const fmt = (n) => String(n).padStart(2, '0');
  const t = `${fmt(now.getHours())}:${fmt(now.getMinutes())}:${fmt(now.getSeconds())}`;
  document.getElementById('clock').textContent = t;
  const t2 = `${fmt(now.getHours())}:${fmt(now.getMinutes())}`;
  const d = document.getElementById('disp-clock');
  if (d) d.textContent = t2;
}
setInterval(tickClock, 1000);
tickClock();

// ─── TOKEN GENERATION ────────────────────────────────
function generateToken(dept) {
  const prefixMap = {
    'General Medicine': 'GM', 'Pediatrics': 'PD', 'Gynecology': 'GY',
    'Eye Care': 'EC', 'Dental': 'DN', 'Orthopedics': 'OR',
    'Dermatology': 'DM', 'ENT': 'EN',
  };
  const prefix = prefixMap[dept] || 'HQ';
  tokenCounter++;
  save();
  return `${prefix}-${String(tokenCounter).padStart(3, '0')}`;
}

// ─── REGISTER FORM ───────────────────────────────────
document.getElementById('register-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name     = document.getElementById('p-name').value.trim();
  const age      = parseInt(document.getElementById('p-age').value);
  const gender   = document.getElementById('p-gender').value;
  const phone    = document.getElementById('p-phone').value.trim();
  const dept     = document.getElementById('p-dept').value;
  const priority = document.getElementById('p-priority').value;
  const complaint= document.getElementById('p-complaint').value.trim();
  const apptDate = document.getElementById('p-appt-date').value;
  const apptTime = document.getElementById('p-appt-time').value;

  if (!name || !age || !gender || !dept) {
    showToast('Please fill all required fields.', 'error'); return;
  }

  const token = generateToken(dept);
  const now = new Date();
  const patient = {
    id: Date.now(),
    token, name, age, gender, phone, dept, priority, complaint,
    apptDate, apptTime,
    regTime: now.toISOString(),
    status: 'waiting',
  };

  // Emergency / senior → unshift (high priority)
  if (priority === 'emergency') {
    const firstWaiting = patients.findIndex(p => p.status === 'waiting');
    if (firstWaiting >= 0) patients.splice(firstWaiting, 0, patient);
    else patients.push(patient);
  } else {
    patients.push(patient);
  }

  save();
  updateSlip(patient);
  showToast(`Token ${token} generated for ${name}!`, 'success');
  refreshAll();
  // scroll slip into view
  document.getElementById('token-slip-panel').scrollIntoView({ behavior: 'smooth' });
  // Reset form
  this.reset();
});

function updateSlip(p) {
  document.getElementById('slip-token').textContent = p.token;
  document.getElementById('slip-name').textContent  = p.name;
  document.getElementById('slip-dept').textContent  = p.dept;
  document.getElementById('slip-priority').textContent = capitalize(p.priority);
  document.getElementById('slip-time').textContent  = fmtTime(p.regTime);

  const waiting = patients.filter(pt => pt.status === 'waiting');
  const myIdx   = waiting.findIndex(pt => pt.id === p.id);
  const ahead   = myIdx >= 0 ? myIdx : 0;
  const estWait = ahead * 7; // assume 7 min per patient

  document.getElementById('slip-ahead').textContent = ahead === 0 ? 'You are next!' : `${ahead} patient${ahead > 1 ? 's' : ''}`;
  document.getElementById('slip-wait').textContent  = estWait === 0 ? 'Very soon' : `~${estWait} min`;
}

function printSlip() {
  window.print();
}

// ─── QUEUE PAGE ──────────────────────────────────────
function renderQueue() {
  const search = (document.getElementById('queue-search')?.value || '').toLowerCase();
  const deptF  = document.getElementById('dept-filter')?.value || '';
  const statF  = document.getElementById('status-filter')?.value || '';

  let filtered = [...patients];
  if (search) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(search) || p.token.toLowerCase().includes(search)
  );
  if (deptF)  filtered = filtered.filter(p => p.dept === deptF);
  if (statF)  filtered = filtered.filter(p => p.status === statF);

  const tbody = document.getElementById('queue-tbody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-td">No patients found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isActionable = p.status === 'waiting' || p.status === 'called';
    return `
    <tr id="row-${p.id}">
      <td><span style="font-family:var(--mono);font-weight:700;color:var(--accent)">${p.token}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.age}/${p.gender[0]}</td>
      <td>${p.dept}</td>
      <td><span class="pri-${p.priority}">${priorityLabel(p.priority)}</span></td>
      <td style="color:var(--text3)">${fmtTime(p.regTime)}</td>
      <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
      <td>
        ${isActionable ? `
          ${p.status === 'waiting' ? `<button class="action-btn call" onclick="callPatient(${p.id})">📢 Call</button>` : ''}
          ${p.status === 'called'  ? `<button class="action-btn done-btn" onclick="markDone(${p.id})">✓ Done</button>` : ''}
          <button class="action-btn skip-btn" onclick="skipPatient(${p.id})">✗ Skip</button>
        ` : `<span style="color:var(--text3);font-size:0.75rem">—</span>`}
      </td>
    </tr>`;
  }).join('');
}

function callPatient(id) {
  const p = patients.find(pt => pt.id === id);
  if (!p) return;
  // reset any previously called patient back to waiting? No — just call new one
  patients.forEach(pt => { if (pt.status === 'called') pt.status = 'waiting'; });
  p.status = 'called';
  save();
  showToast(`📢 Token ${p.token} — ${p.name} called!`, 'warn');
  refreshAll();
}

function callNext() {
  const next = patients.find(p => p.status === 'waiting');
  if (!next) { showToast('No patients in waiting queue.', 'error'); return; }
  callPatient(next.id);
}

function markDone(id) {
  const p = patients.find(pt => pt.id === id);
  if (!p) return;
  p.status = 'done';
  save();
  showToast(`✅ ${p.name} marked as served.`, 'success');
  refreshAll();
}

function skipPatient(id) {
  const p = patients.find(pt => pt.id === id);
  if (!p) return;
  p.status = 'skip';
  save();
  showToast(`⏭ ${p.name} (${p.token}) skipped.`, 'warn');
  refreshAll();
}

// ─── DASHBOARD ───────────────────────────────────────
function renderDashboard() {
  const total   = patients.length;
  const waiting = patients.filter(p => p.status === 'waiting').length;
  const done    = patients.filter(p => p.status === 'done').length;
  const called  = patients.find(p => p.status === 'called');

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-waiting').textContent = waiting;
  document.getElementById('stat-done').textContent    = done;
  document.getElementById('stat-current').textContent = called ? called.token : '—';
  document.getElementById('queue-badge').textContent  = waiting;

  // Queue visual chips
  const qv = document.getElementById('queue-visual');
  const active = patients.filter(p => p.status !== 'done');
  if (!active.length) {
    qv.innerHTML = `<p class="empty-state">No patients in queue yet.</p>`;
  } else {
    qv.innerHTML = active.slice(0, 40).map(p =>
      `<span class="q-chip ${p.status}">${p.token}</span>`
    ).join('');
  }

  // Counters list
  const cl = document.getElementById('counters-list');
  cl.innerHTML = counters.map(c => {
    const serving = patients.find(p => p.status === 'called' && p.dept === c.dept);
    return `
    <div class="counter-row">
      <div class="counter-dot ${c.status}"></div>
      <div class="counter-info">
        <p class="counter-name">${c.name}</p>
        <p class="counter-doc">${c.doctor || 'Unassigned'} · ${c.dept || 'All'}</p>
      </div>
      <span class="counter-token">${serving ? serving.token : c.status === 'active' ? 'Ready' : capitalize(c.status)}</span>
    </div>`;
  }).join('');

  // Recent table (last 8)
  const recent = [...patients].reverse().slice(0, 8);
  const rtb = document.getElementById('recent-tbody');
  rtb.innerHTML = !recent.length
    ? `<tr><td colspan="6" class="empty-td">No records yet</td></tr>`
    : recent.map(p => `
      <tr>
        <td><span style="font-family:var(--mono);font-weight:700;color:var(--accent)">${p.token}</span></td>
        <td>${p.name}</td>
        <td>${p.age} / ${p.gender[0]}</td>
        <td>${p.dept}</td>
        <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
        <td style="color:var(--text3)">${fmtTime(p.regTime)}</td>
      </tr>`).join('');
}

// ─── DISPLAY BOARD ───────────────────────────────────
function renderDisplay() {
  const called  = patients.find(p => p.status === 'called');
  const waiting = patients.filter(p => p.status === 'waiting');
  const done    = patients.filter(p => p.status === 'done');

  document.getElementById('disp-current').textContent = called ? called.token : '—';
  document.getElementById('disp-dept').textContent    = called ? called.dept  : '—';
  document.getElementById('disp-counter').textContent = called ? `${called.name} · Please proceed to counter` : 'No token being served';
  document.getElementById('disp-total-waiting').textContent = `Waiting: ${waiting.length}`;
  document.getElementById('disp-total-done').textContent    = `Served: ${done.length}`;

  const ul = document.getElementById('upcoming-list');
  if (!waiting.length) {
    ul.innerHTML = `<p class="empty-state" style="color:#94a3b8">Queue is empty</p>`;
  } else {
    ul.innerHTML = waiting.slice(0, 5).map(p => `
      <div class="upcoming-token">
        <span class="upcoming-num">${p.token}</span>
        <div class="upcoming-info">
          <p class="upcoming-name">${p.name}</p>
          <p class="upcoming-dept">${p.dept}</p>
        </div>
        <span class="badge badge-waiting" style="font-size:0.62rem">${priorityLabel(p.priority)}</span>
      </div>`).join('');
  }
}

// ─── APPOINTMENTS ────────────────────────────────────
function filterAppt(btn, filter) {
  document.querySelectorAll('.appt-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  apptFilter = filter;
  renderAppointments();
}

function renderAppointments() {
  const today = new Date().toISOString().split('T')[0];
  let filtered = patients.filter(p => p.apptDate); // only those with appt date
  if (apptFilter === 'today') filtered = filtered.filter(p => p.apptDate === today);
  else if (apptFilter === 'upcoming') filtered = filtered.filter(p => p.apptDate > today);

  const tbody = document.getElementById('appt-tbody');
  if (!tbody) return;
  tbody.innerHTML = !filtered.length
    ? `<tr><td colspan="7" class="empty-td">No appointments found.</td></tr>`
    : filtered.map(p => `
      <tr>
        <td><span style="font-family:var(--mono);font-weight:700;color:var(--accent)">${p.token}</span></td>
        <td><strong>${p.name}</strong> <span style="color:var(--text3);font-size:0.75rem">(${p.age}/${p.gender[0]})</span></td>
        <td>${p.dept}</td>
        <td>${p.apptDate || '—'}</td>
        <td>${p.apptTime || '—'}</td>
        <td><span class="pri-${p.priority}">${priorityLabel(p.priority)}</span></td>
        <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
      </tr>`).join('');
}

// ─── DOCTORS / COUNTERS ──────────────────────────────
function renderDoctors() {
  const grid = document.getElementById('doctor-grid');
  if (!grid) return;
  grid.innerHTML = counters.map(c => {
    const initials = (c.name || 'C').charAt(0).toUpperCase();
    const serving  = patients.find(p => p.status === 'called' && (p.dept === c.dept || !c.dept));
    return `
    <div class="counter-card">
      <div class="counter-card-header">
        <div class="counter-avatar">${initials}</div>
        <span class="status-pill ${c.status}">${capitalize(c.status)}</span>
      </div>
      <p class="counter-card-name">${c.name}</p>
      <p class="counter-card-doc">${c.doctor || 'No doctor assigned'}</p>
      <p class="counter-card-dept">${c.dept || 'All Departments'}</p>
      <div class="counter-card-meta">
        <span>${serving ? `Serving: <strong style="color:var(--accent)">${serving.token}</strong>` : 'No patient serving'}</span>
      </div>
      <div class="counter-card-actions">
        <button class="btn-edit" onclick="editCounter(${c.id})">✏ Edit</button>
        <button class="btn-del"  onclick="deleteCounter(${c.id})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
  if (!counters.length) {
    grid.innerHTML = `<p class="empty-state">No counters added. Click "+ Add Counter".</p>`;
  }
}

function openAddCounterModal() {
  editCounterId = null;
  document.getElementById('c-name').value   = '';
  document.getElementById('c-doctor').value = '';
  document.getElementById('c-dept').value   = '';
  document.getElementById('c-status').value = 'active';
  document.getElementById('modal-overlay').classList.add('open');
}

function editCounter(id) {
  const c = counters.find(x => x.id === id);
  if (!c) return;
  editCounterId = id;
  document.getElementById('c-name').value   = c.name;
  document.getElementById('c-doctor').value = c.doctor || '';
  document.getElementById('c-dept').value   = c.dept || '';
  document.getElementById('c-status').value = c.status;
  document.getElementById('modal-overlay').classList.add('open');
}

function deleteCounter(id) {
  if (!confirm('Delete this counter?')) return;
  counters = counters.filter(c => c.id !== id);
  save();
  renderDoctors();
  renderDashboard();
  showToast('Counter removed.', 'warn');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('counter-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name   = document.getElementById('c-name').value.trim();
  const doctor = document.getElementById('c-doctor').value.trim();
  const dept   = document.getElementById('c-dept').value;
  const status = document.getElementById('c-status').value;
  if (!name) return;

  if (editCounterId !== null) {
    const c = counters.find(x => x.id === editCounterId);
    if (c) Object.assign(c, { name, doctor, dept, status });
  } else {
    counters.push({ id: Date.now(), name, doctor, dept, status, serving: null });
  }
  save();
  closeModal();
  renderDoctors();
  renderDashboard();
  showToast(editCounterId ? 'Counter updated!' : 'Counter added!', 'success');
  editCounterId = null;
});

// ─── REPORTS ─────────────────────────────────────────
function renderReports() {
  const total   = patients.length;
  const done    = patients.filter(p => p.status === 'done').length;
  const waiting = patients.filter(p => p.status === 'waiting' || p.status === 'called').length;
  const skip    = patients.filter(p => p.status === 'skip').length;

  document.getElementById('rep-total').textContent   = total;
  document.getElementById('rep-done').textContent    = done;
  document.getElementById('rep-waiting').textContent = waiting;
  document.getElementById('rep-skip').textContent    = skip;

  const depts = ['General Medicine','Pediatrics','Gynecology','Eye Care','Dental','Orthopedics','Dermatology','ENT'];
  const tbody = document.getElementById('dept-report-tbody');
  if (!tbody) return;

  const rows = depts.map(d => {
    const dp = patients.filter(p => p.dept === d);
    if (!dp.length) return null;
    const dTotal   = dp.length;
    const dDone    = dp.filter(p => p.status === 'done').length;
    const dWaiting = dp.filter(p => p.status === 'waiting' || p.status === 'called').length;
    const dSkip    = dp.filter(p => p.status === 'skip').length;
    return { d, dTotal, dDone, dWaiting, dSkip };
  }).filter(Boolean);

  tbody.innerHTML = !rows.length
    ? `<tr><td colspan="5" class="empty-td">No data yet.</td></tr>`
    : rows.map(r => `
      <tr>
        <td>${r.d}</td>
        <td><strong>${r.dTotal}</strong></td>
        <td style="color:var(--green)">${r.dDone}</td>
        <td style="color:var(--yellow)">${r.dWaiting}</td>
        <td style="color:var(--red)">${r.dSkip}</td>
      </tr>`).join('');

  // Bar chart
  const chart = document.getElementById('bar-chart');
  if (!chart) return;
  const maxVal = Math.max(...rows.map(r => r.dTotal), 1);
  const maxH = 140;
  chart.innerHTML = rows.length
    ? rows.map(r => {
        const h = Math.max(4, Math.round((r.dTotal / maxVal) * maxH));
        return `
        <div class="bar-item">
          <div class="bar-fill" style="height:${h}px" data-val="${r.dTotal}"></div>
          <span class="bar-label">${r.d.split(' ').slice(0,2).join(' ')}</span>
        </div>`;
      }).join('')
    : `<p class="empty-state">No data yet.</p>`;
}

// ─── REFRESH ALL ─────────────────────────────────────
function refreshAll() {
  renderDashboard();
  renderQueue();
  renderDisplay();
  renderAppointments();
  renderDoctors();
  renderReports();
}

// ─── TOAST ───────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

// ─── HELPERS ─────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function statusLabel(s) {
  return { waiting: 'Waiting', called: 'Called', done: 'Done', skip: 'Skipped' }[s] || s;
}

function priorityLabel(p) {
  return { normal: 'Normal', senior: '👴 Senior', emergency: '🚨 Emergency', pregnant: '🤰 Pregnant' }[p] || p;
}

// ─── SEED DEMO DATA (first load) ─────────────────────
function seedDemo() {
  if (patients.length > 0) return;
  const demoPatients = [
    { name: 'Ravi Kumar',    age: 45, gender: 'Male',   phone: '9876543210', dept: 'General Medicine', priority: 'normal',    complaint: 'Fever and cold', apptDate: new Date().toISOString().split('T')[0], apptTime: '09:00 AM' },
    { name: 'Priya Sharma',  age: 28, gender: 'Female', phone: '9876543211', dept: 'Gynecology',       priority: 'pregnant',  complaint: 'Routine check', apptDate: new Date().toISOString().split('T')[0], apptTime: '09:30 AM' },
    { name: 'Arun Singh',    age: 6,  gender: 'Male',   phone: '9876543212', dept: 'Pediatrics',       priority: 'normal',    complaint: 'Vaccination', apptDate: new Date().toISOString().split('T')[0], apptTime: '10:00 AM' },
    { name: 'Meera Pillai',  age: 65, gender: 'Female', phone: '9876543213', dept: 'Eye Care',         priority: 'senior',    complaint: 'Blurry vision', apptDate: new Date().toISOString().split('T')[0], apptTime: '10:30 AM' },
    { name: 'Suresh Rao',    age: 38, gender: 'Male',   phone: '9876543214', dept: 'Dental',           priority: 'normal',    complaint: 'Toothache', apptDate: new Date().toISOString().split('T')[0], apptTime: '11:00 AM' },
    { name: 'Anita Nair',    age: 32, gender: 'Female', phone: '9876543215', dept: 'Dermatology',      priority: 'normal',    complaint: 'Skin rash', apptDate: '', apptTime: '' },
    { name: 'Kiran Patel',   age: 72, gender: 'Male',   phone: '9876543216', dept: 'General Medicine', priority: 'emergency', complaint: 'Chest pain', apptDate: '', apptTime: '' },
    { name: 'Divya Menon',   age: 25, gender: 'Female', phone: '9876543217', dept: 'ENT',              priority: 'normal',    complaint: 'Ear pain', apptDate: '', apptTime: '' },
  ];
  demoPatients.forEach((pd, i) => {
    const token = generateToken(pd.dept);
    const now = new Date(Date.now() - (demoPatients.length - i) * 420000);
    patients.push({ id: Date.now() + i, token, ...pd, regTime: now.toISOString(), status: i < 2 ? 'done' : (i === 2 ? 'called' : 'waiting') });
  });
  save();
}

// ─── INIT ─────────────────────────────────────────────
// Login screen controls the startup — app-shell is hidden by default via CSS
// seedDemo() and refreshAll() are called by enterApp() after login
