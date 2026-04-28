// ── CONFIG & AUTH ─────────────────────────────────────────────
let API = localStorage.getItem('mediaiApiUrl') || 'http://127.0.0.1:5001';

// Check login — redirect to login page if not logged in
const currentUser = JSON.parse(localStorage.getItem('mediai_user') || 'null');
if (!currentUser) {
  window.location.href = 'login.html';
}

function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  localStorage.removeItem('mediai_user');
  window.location.href = 'login.html';
}

// ── GLOBAL STATE ──────────────────────────────────────────────
let selectedSymptoms = [];
let currentScanType = 'pneumonia';
let currentImageB64 = null;
let recentScans = JSON.parse(localStorage.getItem('mediai_scans') || '[]');

const SCAN_LABELS = {
  pneumonia:   'Chest X-Ray — Pneumonia',
  brain_tumor: 'Brain MRI — Tumor',
  skin_cancer: 'Skin Dermoscopy — Cancer',
  covid19:     'Chest X-Ray — COVID-19',
  kidney:      'Kidney CT — Abnormalities',
  eye:         'Retinal Fundus — Diabetic Retinopathy',
};

// ── DEFAULT DISEASES ──────────────────────────────────────────
const DEFAULT_DISEASES = [
  { name:'Diabetes', specialty:'Endocrinology', urgency:'High', icon:'🩸', symptoms:'increased thirst, frequent urination, fatigue, blurred vision', markers:'High blood glucose, HbA1c > 6.5%', desc:'Metabolic disease causing high blood sugar due to insufficient insulin.' },
  { name:'Heart Disease', specialty:'Cardiology', urgency:'Critical', icon:'❤️', symptoms:'chest pain, shortness of breath, fatigue, irregular heartbeat', markers:'Elevated troponin, abnormal ECG', desc:'Cardiovascular conditions affecting the heart structure and function.' },
  { name:'Kidney Disease', specialty:'Nephrology', urgency:'High', icon:'🫘', symptoms:'fatigue, swelling, decreased urine output, nausea', markers:'High creatinine, low GFR, proteinuria', desc:'Chronic kidney disease causes gradual loss of kidney function.' },
  { name:'Liver Disease', specialty:'Hepatology', urgency:'High', icon:'🫁', symptoms:'jaundice, fatigue, abdominal pain, nausea', markers:'Elevated ALT, AST, bilirubin', desc:'Liver conditions including hepatitis, cirrhosis, and fatty liver disease.' },
  { name:'Breast Cancer', specialty:'Oncology', urgency:'High', icon:'🎗️', symptoms:'lump in breast, skin changes, nipple discharge', markers:'Abnormal mammogram, biopsy results', desc:'Malignant tumor originating in breast tissue cells.' },
  { name:'Pneumonia', specialty:'Pulmonology', urgency:'High', icon:'🫁', symptoms:'cough, fever, chills, difficulty breathing', markers:'Chest X-ray infiltrates, elevated WBC', desc:'Infection causing inflammation in the air sacs of one or both lungs.' },
  { name:'Malaria', specialty:'Infectious Disease', urgency:'High', icon:'🦟', symptoms:'fever, chills, headache, muscle pain, nausea', markers:'Positive blood smear, low platelet count', desc:'Mosquito-borne infectious disease caused by Plasmodium parasites.' },
  { name:'Dengue', specialty:'Infectious Disease', urgency:'High', icon:'🦠', symptoms:'high fever, severe headache, skin rash, joint pain', markers:'Low platelet count, positive NS1 antigen', desc:'Viral infection transmitted by Aedes mosquitoes.' },
  { name:'Tuberculosis', specialty:'Pulmonology', urgency:'High', icon:'🫁', symptoms:'persistent cough, weight loss, night sweats, fever', markers:'Positive TB test, chest X-ray changes', desc:'Bacterial infection primarily affecting the lungs.' },
  { name:'Hypertension', specialty:'Cardiology', urgency:'High', icon:'💉', symptoms:'headache, dizziness, chest pain, vision problems', markers:'BP > 140/90 mmHg consistently', desc:'Chronically elevated blood pressure increasing heart disease risk.' },
  { name:'Migraine', specialty:'Neurology', urgency:'Medium', icon:'🧠', symptoms:'severe headache, nausea, light sensitivity, visual aura', markers:'Clinical diagnosis, pain diary', desc:'Neurological condition causing intense throbbing headaches.' },
  { name:'Asthma', specialty:'Pulmonology', urgency:'High', icon:'💨', symptoms:'wheezing, coughing, chest tightness, breathlessness', markers:'Peak flow variability, spirometry', desc:'Chronic respiratory condition causing airway inflammation and narrowing.' },
  { name:'Arthritis', specialty:'Rheumatology', urgency:'Medium', icon:'🦴', symptoms:'joint pain, stiffness, swelling, reduced range of motion', markers:'Elevated ESR, CRP, X-ray changes', desc:'Inflammation of joints causing pain and disability.' },
  { name:'Hypothyroidism', specialty:'Endocrinology', urgency:'Medium', icon:'🦋', symptoms:'fatigue, weight gain, cold intolerance, dry skin', markers:'Elevated TSH, low T4', desc:'Underactive thyroid gland producing insufficient thyroid hormones.' },
  { name:'Acne', specialty:'Dermatology', urgency:'Low', icon:'🔴', symptoms:'pimples, blackheads, whiteheads, oily skin', markers:'Clinical skin examination', desc:'Skin condition causing pimples and spots on the face and body.' },
  { name:'Psoriasis', specialty:'Dermatology', urgency:'Low', icon:'🩹', symptoms:'red patches, silvery scales, dry skin, itching', markers:'Skin biopsy, clinical appearance', desc:'Autoimmune condition causing rapid skin cell buildup.' },
  { name:'Typhoid', specialty:'Infectious Disease', urgency:'High', icon:'🌡️', symptoms:'prolonged fever, weakness, abdominal pain, headache', markers:'Widal test positive, blood culture', desc:'Bacterial infection caused by Salmonella typhi.' },
  { name:'Hepatitis B', specialty:'Hepatology', urgency:'High', icon:'🦠', symptoms:'jaundice, fatigue, nausea, abdominal pain', markers:'HBsAg positive, elevated liver enzymes', desc:'Viral infection attacking the liver causing chronic disease.' },
  { name:'COVID-19', specialty:'Infectious Disease', urgency:'High', icon:'😷', symptoms:'fever, cough, loss of taste/smell, fatigue, breathlessness', markers:'Positive PCR/antigen test, CT chest changes', desc:'Respiratory illness caused by the SARS-CoV-2 coronavirus.' },
  { name:'Common Cold', specialty:'General Practice', urgency:'Low', icon:'🤧', symptoms:'runny nose, sneezing, sore throat, mild fever', markers:'Clinical diagnosis', desc:'Viral upper respiratory tract infection caused by rhinoviruses.' },
  { name:'Urinary Tract Infection', specialty:'Urology', urgency:'Medium', icon:'🔬', symptoms:'burning urination, frequent urge to urinate, cloudy urine', markers:'Urine culture, elevated WBC in urine', desc:'Bacterial infection affecting any part of the urinary system.' },
  { name:'Vertigo', specialty:'Neurology', urgency:'Medium', icon:'🌀', symptoms:'dizziness, spinning sensation, nausea, balance problems', markers:'Dix-Hallpike test, caloric testing', desc:'Sensation of spinning or dizziness due to inner ear issues.' },
  { name:'Gastroenteritis', specialty:'Gastroenterology', urgency:'Medium', icon:'🤢', symptoms:'diarrhea, vomiting, stomach cramps, nausea, fever', markers:'Stool culture, clinical diagnosis', desc:'Inflammation of stomach and intestines causing diarrhea and vomiting.' },
  { name:'Chickenpox', specialty:'Dermatology', urgency:'Medium', icon:'💊', symptoms:'itchy blisters, fever, fatigue, loss of appetite', markers:'Clinical appearance, VZV IgM antibodies', desc:'Highly contagious viral infection caused by varicella-zoster virus.' },
  { name:'Anemia', specialty:'Hematology', urgency:'Medium', icon:'🩸', symptoms:'fatigue, pale skin, shortness of breath, dizziness', markers:'Low hemoglobin, low hematocrit, low RBC', desc:'Condition with insufficient healthy red blood cells to carry oxygen.' },
];

// ── DATABASE ──────────────────────────────────────────────────
function getDB() {
  return {
    patients: JSON.parse(localStorage.getItem('mediai_patients') || '[]'),
    diseases: JSON.parse(localStorage.getItem('mediai_diseases') || JSON.stringify(DEFAULT_DISEASES)),
  };
}
function saveDB(key, data) {
  localStorage.setItem(`mediai_${key}`, JSON.stringify(data));
}

// ── NAVIGATION ────────────────────────────────────────────────
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  if (name === 'dashboard') refreshDashboard();
  if (name === 'patients')  renderPatientsTable();
  if (name === 'diseases')  renderDiseaseGrid();
  if (name === 'analytics') renderAnalyticsCharts();
  if (name === 'settings')  { refreshSettings(); loadUsers(); }
  if (name === 'imaging')   renderRecentScans();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── DASHBOARD ─────────────────────────────────────────────────
function refreshDashboard() {
  const db = getDB();
  const today = new Date().toDateString();
  const todayDiags = db.patients.filter(p => new Date(p.date).toDateString() === today).length;
  const highRisk = db.patients.filter(p => p.risk === 'High' || p.risk === 'Critical').length;
  animateCount('totalPatients', db.patients.length);
  animateCount('diagnosesToday', todayDiags);
  animateCount('diseasesTracked', db.diseases.length);
  animateCount('highRisk', highRisk);
  renderRecentPatients(db.patients.slice(-5).reverse());
  renderTrendChart();
  renderPieChart(db.patients);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}

function renderRecentPatients(patients) {
  const tbody = document.getElementById('recentPatientsTable');
  if (!tbody) return;
  if (!patients.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">No patients yet.</td></tr>';
    return;
  }
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><code style="color:var(--accent);font-size:0.8rem">${p.id}</code></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.age}</td>
      <td>${p.diagnosis || '—'}</td>
      <td><span class="risk ${(p.risk||'low').toLowerCase()}">${p.risk || 'Low'}</span></td>
      <td style="color:var(--muted)">${formatDate(p.date)}</td>
      <td><button class="tbl-btn" onclick="viewPatient('${p.id}')">View</button></td>
    </tr>`).join('');
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  const ex = Chart.getChart(ctx); if (ex) ex.destroy();
  const db = getDB(), days = [], counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en', { weekday: 'short' }));
    counts.push(db.patients.filter(p => new Date(p.date).toDateString() === d.toDateString()).length);
  }
  new Chart(ctx, { type:'line', data:{ labels:days, datasets:[{ data:counts, borderColor:'#00c8ff', backgroundColor:'rgba(0,200,255,0.08)', fill:true, tension:0.4, pointBackgroundColor:'#00c8ff', pointRadius:4 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#4a6280'}}, y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#4a6280',stepSize:1,precision:0},beginAtZero:true} } } });
}

function renderPieChart(patients) {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;
  const ex = Chart.getChart(ctx); if (ex) ex.destroy();
  const counts = {};
  patients.forEach(p => { if (p.diagnosis && p.diagnosis !== '—') counts[p.diagnosis] = (counts[p.diagnosis]||0)+1; });
  const labels = Object.keys(counts).slice(0,6);
  const data = labels.map(l => counts[l]);
  new Chart(ctx, { type:'doughnut', data:{ labels: labels.length ? labels : ['No data'], datasets:[{ data: data.length ? data : [1], backgroundColor:['#00c8ff','#0066ff','#00e5a0','#ffd166','#ff6b9d','#a78bfa'], borderWidth:0 }] }, options:{ responsive:true, cutout:'65%', plugins:{legend:{position:'bottom',labels:{color:'#4a6280',font:{size:11}}}} } });
}

// ── SYMPTOM CHECKER ───────────────────────────────────────────
function addSymptom() {
  const input = document.getElementById('symptomInput');
  const val = input.value.trim().toLowerCase().replace(/ /g, '_');
  if (val && !selectedSymptoms.includes(val)) { selectedSymptoms.push(val); renderTags(); }
  input.value = '';
}
function quickAdd(s) { if (!selectedSymptoms.includes(s)) { selectedSymptoms.push(s); renderTags(); } }
function removeSymptom(s) { selectedSymptoms = selectedSymptoms.filter(x => x !== s); renderTags(); }
function renderTags() {
  const c = document.getElementById('selectedSymptoms');
  if (!c) return;
  c.innerHTML = selectedSymptoms.length
    ? selectedSymptoms.map(s => `<span class="tag" onclick="removeSymptom('${s}')">${s} ✕</span>`).join('')
    : '<span style="color:var(--muted);font-size:0.82rem">No symptoms added yet...</span>';
}

async function analyzeSymptoms() {
  if (!selectedSymptoms.length) { showToast('Add at least one symptom first', 'error'); return; }
  const panel = document.getElementById('resultPanel');
  panel.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted)"><div style="font-size:2rem;margin-bottom:0.5rem">⏳</div>Analyzing symptoms...</div>';
  try {
    const res = await fetch(`${API}/predict/symptoms`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ symptoms: selectedSymptoms }) });
    const data = await res.json();
    const urgencyColor = { Critical:'var(--red)', High:'var(--red)', Medium:'var(--yellow)', Low:'var(--green)' }[data.urgency] || 'var(--accent)';
    panel.innerHTML = `
      <div class="result-output">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
          <span style="font-size:1.5rem">🩺</span>
          <div>
            <div style="font-size:0.75rem;color:var(--muted);font-weight:600;text-transform:uppercase">Primary Diagnosis</div>
            <h3 style="color:var(--accent)">${data.primary_diagnosis}</h3>
          </div>
        </div>
        <div class="conf-bar"><div class="conf-fill" style="width:${data.confidence}%"></div></div>
        <div style="display:flex;gap:1rem;font-size:0.82rem;color:var(--muted);margin-bottom:1rem">
          <span>Confidence: <strong style="color:var(--text)">${data.confidence}%</strong></span>
          <span>Specialty: <strong style="color:var(--text)">${data.specialty}</strong></span>
          <span>Urgency: <strong style="color:${urgencyColor}">${data.urgency}</strong></span>
        </div>
        <div style="font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--muted)">DIFFERENTIAL DIAGNOSIS</div>
        ${data.differential_diagnosis.map((d,i) => `
          <div class="diff-item">
            <span>${i===0?'🥇':i===1?'🥈':'🥉'} ${d.disease}</span>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <div style="width:80px;background:var(--border);border-radius:50px;height:5px;overflow:hidden">
                <div style="width:${d.confidence}%;height:100%;background:var(--accent2);border-radius:50px"></div>
              </div>
              <span style="color:var(--muted);min-width:40px;text-align:right">${d.confidence}%</span>
            </div>
          </div>`).join('')}
        <p class="disclaimer">⚠️ For informational purposes only. Always consult a qualified medical professional.</p>
      </div>`;
    showToast(`Diagnosis: ${data.primary_diagnosis}`, 'success');
  } catch(err) {
    panel.innerHTML = `<div style="padding:1.5rem"><div style="color:var(--red);margin-bottom:0.5rem">❌ Cannot connect to backend</div><div style="color:var(--muted);font-size:0.82rem">Run: <code>cd backend && python3 app.py</code></div></div>`;
  }
}

// ── DISEASE FORMS ─────────────────────────────────────────────
const DISEASE_FORMS = {
  diabetes:     [{id:'d_preg',label:'Pregnancies',placeholder:'e.g. 2'},{id:'d_glucose',label:'Glucose',placeholder:'e.g. 120'},{id:'d_bp',label:'Blood Pressure',placeholder:'e.g. 70'},{id:'d_skin',label:'Skin Thickness',placeholder:'e.g. 20'},{id:'d_insulin',label:'Insulin',placeholder:'e.g. 80'},{id:'d_bmi',label:'BMI',placeholder:'e.g. 25.5'},{id:'d_dpf',label:'Diabetes Pedigree',placeholder:'e.g. 0.5'},{id:'d_age',label:'Age',placeholder:'e.g. 35'}],
  heart:        [{id:'h_age',label:'Age',placeholder:'e.g. 55'},{id:'h_sex',label:'Sex (1=Male 0=Female)',placeholder:'1 or 0'},{id:'h_cp',label:'Chest Pain (0-3)',placeholder:'0-3'},{id:'h_trestbps',label:'Resting BP',placeholder:'e.g. 130'},{id:'h_chol',label:'Cholesterol',placeholder:'e.g. 250'},{id:'h_fbs',label:'Fasting Blood Sugar',placeholder:'1 or 0'},{id:'h_recg',label:'Resting ECG (0-2)',placeholder:'0-2'},{id:'h_thalach',label:'Max Heart Rate',placeholder:'e.g. 150'},{id:'h_exang',label:'Exercise Angina',placeholder:'1 or 0'},{id:'h_oldpeak',label:'ST Depression',placeholder:'e.g. 1.5'},{id:'h_slope',label:'Slope (0-2)',placeholder:'0-2'},{id:'h_ca',label:'Major Vessels (0-3)',placeholder:'0-3'},{id:'h_thal',label:'Thal (0-3)',placeholder:'0-3'}],
  kidney:       [{id:'k_age',label:'Age',placeholder:'e.g. 45'},{id:'k_bp',label:'Blood Pressure',placeholder:'e.g. 80'},{id:'k_sg',label:'Specific Gravity',placeholder:'e.g. 1.020'},{id:'k_al',label:'Albumin (0-5)',placeholder:'0-5'},{id:'k_su',label:'Sugar (0-5)',placeholder:'0-5'},{id:'k_bgr',label:'Blood Glucose',placeholder:'e.g. 120'},{id:'k_bu',label:'Blood Urea',placeholder:'e.g. 40'},{id:'k_sc',label:'Serum Creatinine',placeholder:'e.g. 1.2'},{id:'k_hemo',label:'Hemoglobin',placeholder:'e.g. 13.5'}],
  liver:        [{id:'l_age',label:'Age',placeholder:'e.g. 40'},{id:'l_gender',label:'Gender (1=Male 0=Female)',placeholder:'1 or 0'},{id:'l_tb',label:'Total Bilirubin',placeholder:'e.g. 1.0'},{id:'l_db',label:'Direct Bilirubin',placeholder:'e.g. 0.3'},{id:'l_ap',label:'Alkaline Phosphotase',placeholder:'e.g. 200'},{id:'l_aa',label:'Alamine Aminotransferase',placeholder:'e.g. 35'},{id:'l_asa',label:'Aspartate Aminotransferase',placeholder:'e.g. 40'},{id:'l_tp',label:'Total Proteins',placeholder:'e.g. 6.8'},{id:'l_alb',label:'Albumin',placeholder:'e.g. 3.5'},{id:'l_agr',label:'Albumin/Globulin Ratio',placeholder:'e.g. 1.0'}],
  breast_cancer:[{id:'bc_rm',label:'Radius Mean',placeholder:'e.g. 14.5'},{id:'bc_tm',label:'Texture Mean',placeholder:'e.g. 19.5'},{id:'bc_pm',label:'Perimeter Mean',placeholder:'e.g. 95.0'},{id:'bc_am',label:'Area Mean',placeholder:'e.g. 650'},{id:'bc_sm',label:'Smoothness Mean',placeholder:'e.g. 0.10'},{id:'bc_cm',label:'Compactness Mean',placeholder:'e.g. 0.12'},{id:'bc_conc',label:'Concavity Mean',placeholder:'e.g. 0.09'},{id:'bc_sym',label:'Symmetry Mean',placeholder:'e.g. 0.18'}]
};

function showDiseaseForm() {
  const type = document.getElementById('diseaseModel').value;
  const container = document.getElementById('diseaseFormContainer');
  const btn = document.getElementById('runCsvBtn');
  if (!type) { container.innerHTML = ''; btn.style.display = 'none'; return; }
  container.innerHTML = `<div class="csv-form">${(DISEASE_FORMS[type]||[]).map(f => `<div class="form-group"><label>${f.label}</label><input type="number" id="${f.id}" placeholder="${f.placeholder}" step="any"/></div>`).join('')}</div>`;
  btn.style.display = 'block';
}

async function runCsvPrediction() {
  const type = document.getElementById('diseaseModel').value;
  if (!type) return;
  const features = [];
  for (const f of DISEASE_FORMS[type]) {
    const val = document.getElementById(f.id)?.value;
    if (!val && val !== '0') { showToast(`Please fill in: ${f.label}`, 'error'); return; }
    features.push(parseFloat(val));
  }
  const panel = document.getElementById('resultPanel');
  panel.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted)"><div style="font-size:2rem;margin-bottom:0.5rem">🧪</div>Running clinical prediction...</div>';
  try {
    const res = await fetch(`${API}/predict/csv`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ disease_type: type, features }) });
    const data = await res.json();
    const isPositive = data.result === 1 || (data.result_label||'').toLowerCase().includes('detected') || (data.result_label||'').toLowerCase().includes('malignant') || (data.result_label||'').toLowerCase().includes('ckd');
    const color = isPositive ? 'var(--red)' : 'var(--green)';
    const icon = isPositive ? '⚠️' : '✅';
    panel.innerHTML = `
      <div class="result-output">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
          <span style="font-size:2rem">${icon}</span>
          <div>
            <div style="font-size:0.75rem;color:var(--muted);font-weight:600;text-transform:uppercase">Clinical Prediction</div>
            <h3 style="color:${color}">${data.result_label}</h3>
          </div>
        </div>
        <div class="conf-bar"><div class="conf-fill" style="width:${data.confidence}%;background:${isPositive?'linear-gradient(90deg,#c00,var(--red))':'linear-gradient(90deg,#00a070,var(--green))'}"></div></div>
        <p style="font-size:0.85rem;color:var(--muted);margin:0.5rem 0 0.75rem">Confidence: <strong style="color:var(--text)">${data.confidence}%</strong></p>
        ${isPositive ? `<div style="background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.2);border-radius:8px;padding:0.75rem;font-size:0.82rem;color:var(--red)">⚠️ High risk detected. Immediate medical consultation recommended.</div>` : `<div style="background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.2);border-radius:8px;padding:0.75rem;font-size:0.82rem;color:var(--green)">✅ No significant risk detected. Continue regular health monitoring.</div>`}
        <p class="disclaimer">⚠️ For informational purposes only. Always consult a qualified medical professional.</p>
      </div>`;
    showToast(data.result_label, isPositive ? 'error' : 'success');
  } catch(err) {
    panel.innerHTML = `<div style="padding:1.5rem;color:var(--red)">❌ Backend not connected.</div>`;
  }
}

// ── ACCURACY CHART ────────────────────────────────────────────
function renderAccuracyChart() {
  const ctx = document.getElementById('accuracyChart');
  if (!ctx) return;
  const ex = Chart.getChart(ctx); if (ex) ex.destroy();
  new Chart(ctx, { type:'bar', data:{ labels:['Symptom','Kidney','Breast Cancer','Heart','Diabetes','Liver'], datasets:[{ data:[100,98.75,97.37,93.17,75.32,73.50], backgroundColor:['#00e5a0','#00c8ff','#0066ff','#ffd166','#ff6b9d','#a78bfa'], borderRadius:6, borderWidth:0 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#4a6280',font:{size:10}}}, y:{min:60,max:105,grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a6280',callback:v=>v+'%'}} } } });
}

// ── PATIENTS ──────────────────────────────────────────────────
function addPatient() {
  const id = document.getElementById('m_id').value.trim();
  const name = document.getElementById('m_name').value.trim();
  const age = document.getElementById('m_age').value.trim();
  if (!id || !name || !age) { showToast('ID, Name, and Age are required', 'error'); return; }
  const db = getDB();
  if (db.patients.find(p => p.id === id)) { showToast('Patient ID already exists', 'error'); return; }
  db.patients.push({ id, name, age:parseInt(age), gender:document.getElementById('m_gender').value, diagnosis:document.getElementById('m_diagnosis').value.trim()||'—', risk:document.getElementById('m_risk').value, contact:document.getElementById('m_contact').value.trim(), history:document.getElementById('m_history').value.trim(), date:new Date().toISOString(), addedBy: currentUser?.full_name || 'Admin' });
  saveDB('patients', db.patients);
  document.getElementById('addPatientModal').style.display = 'none';
  ['m_id','m_name','m_age','m_diagnosis','m_contact','m_history'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  renderPatientsTable();
  showToast(`Patient ${name} added`, 'success');
  refreshDashboard();
}

function renderPatientsTable(filter = '') {
  const db = getDB();
  const patients = filter ? db.patients.filter(p => p.name.toLowerCase().includes(filter) || p.id.toLowerCase().includes(filter) || (p.diagnosis||'').toLowerCase().includes(filter)) : db.patients;
  const countEl = document.getElementById('patientCount');
  if (countEl) countEl.textContent = `${patients.length} records`;
  const tbody = document.getElementById('allPatientsTable');
  if (!tbody) return;
  if (!patients.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem">No patients found.</td></tr>'; return; }
  tbody.innerHTML = [...patients].reverse().map(p => `
    <tr>
      <td><code style="color:var(--accent);font-size:0.8rem">${p.id}</code></td>
      <td><strong>${p.name}</strong></td><td>${p.age}</td><td>${p.gender}</td><td>${p.diagnosis}</td>
      <td><span class="risk ${(p.risk||'low').toLowerCase()}">${p.risk}</span></td>
      <td style="color:var(--muted)">${p.contact||'—'}</td>
      <td style="color:var(--muted)">${formatDate(p.date)}</td>
      <td>
        <button class="tbl-btn" onclick="viewPatient('${p.id}')">👁 View</button>
        <button class="tbl-btn del" onclick="deletePatient('${p.id}')">🗑</button>
      </td>
    </tr>`).join('');
}

function filterPatients(val) { renderPatientsTable(val.toLowerCase()); }

function viewPatient(id) {
  const p = getDB().patients.find(x => x.id === id);
  if (!p) return;
  document.getElementById('patientDetailContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">PATIENT ID</div><div style="font-family:'Clash Display';color:var(--accent)">${p.id}</div></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">FULL NAME</div><div style="font-weight:700">${p.name}</div></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">AGE / GENDER</div><div>${p.age} years / ${p.gender}</div></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">CONTACT</div><div>${p.contact||'—'}</div></div>
      </div>
      <div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">DIAGNOSIS</div><div style="font-weight:700;color:var(--accent)">${p.diagnosis}</div></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">RISK LEVEL</div><span class="risk ${(p.risk||'low').toLowerCase()}">${p.risk}</span></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem;margin-bottom:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">MEDICAL HISTORY</div><div>${p.history||'—'}</div></div>
        <div style="background:var(--bg2);border-radius:10px;padding:1rem"><div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.25rem">ADDED BY / DATE</div><div>${p.addedBy||'Admin'} · ${formatDate(p.date)}</div></div>
      </div>
    </div>`;
  document.getElementById('patientDetailModal').style.display = 'flex';
}

function deletePatient(id) {
  if (!confirm('Delete this patient record?')) return;
  const db = getDB();
  saveDB('patients', db.patients.filter(p => p.id !== id));
  renderPatientsTable();
  refreshDashboard();
  showToast('Patient deleted', 'error');
}

// ── DISEASES ──────────────────────────────────────────────────
function renderDiseaseGrid() {
  const db = getDB();
  const grid = document.getElementById('diseaseGrid');
  if (!grid) return;
  grid.innerHTML = db.diseases.map(d => `
    <div class="disease-card">
      <div class="dic-icon">${d.icon||'🦠'}</div>
      <h4>${d.name}</h4>
      <p>${d.desc||'No description available.'}</p>
      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem"><strong>Symptoms:</strong> ${d.symptoms||'—'}</div>
      <div class="disease-meta"><span class="specialty">${d.specialty}</span><span class="dis-urgency ${(d.urgency||'low').toLowerCase()}">${d.urgency}</span></div>
    </div>`).join('');
}

function addDisease() {
  const name = document.getElementById('dis_name').value.trim();
  if (!name) { showToast('Disease name is required', 'error'); return; }
  const db = getDB();
  db.diseases.push({ name, specialty:document.getElementById('dis_specialty').value.trim()||'General', symptoms:document.getElementById('dis_symptoms').value.trim(), markers:document.getElementById('dis_markers').value.trim(), urgency:document.getElementById('dis_urgency').value, icon:document.getElementById('dis_icon').value.trim()||'🦠', desc:document.getElementById('dis_desc').value.trim() });
  saveDB('diseases', db.diseases);
  document.getElementById('addDiseaseModal').style.display = 'none';
  ['dis_name','dis_specialty','dis_symptoms','dis_markers','dis_icon','dis_desc'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  renderDiseaseGrid();
  showToast(`Disease "${name}" added`, 'success');
}

// ── ANALYTICS ─────────────────────────────────────────────────
function renderAnalyticsCharts() {
  const db = getDB();
  const monthCtx = document.getElementById('monthlyChart');
  if (monthCtx) {
    const ex = Chart.getChart(monthCtx); if (ex) ex.destroy();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const counts = new Array(12).fill(0);
    db.patients.forEach(p => { counts[new Date(p.date).getMonth()]++; });
    new Chart(monthCtx, { type:'bar', data:{ labels:months, datasets:[{ data:counts, backgroundColor:'rgba(0,102,255,0.7)', borderRadius:6, borderWidth:0 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#4a6280'}}, y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a6280',stepSize:1,precision:0},beginAtZero:true} } } });
  }
  const riskCtx = document.getElementById('riskChart');
  if (riskCtx) {
    const ex = Chart.getChart(riskCtx); if (ex) ex.destroy();
    const rc = { Low:0, Medium:0, High:0, Critical:0 };
    db.patients.forEach(p => { if (p.risk in rc) rc[p.risk]++; });
    const hasData = Object.values(rc).some(v => v > 0);
    new Chart(riskCtx, { type:'doughnut', data:{ labels: hasData ? Object.keys(rc) : ['No data'], datasets:[{ data: hasData ? Object.values(rc) : [1], backgroundColor: hasData ? ['#00e5a0','#ffd166','#ff4d6d','#ff1a40'] : ['#1a2d4a'], borderWidth:0 }] }, options:{ responsive:true, cutout:'60%', plugins:{legend:{position:'bottom',labels:{color:'#4a6280',font:{size:11}}}} } });
  }
  const topCtx = document.getElementById('topDiseasesChart');
  if (topCtx) {
    const ex = Chart.getChart(topCtx); if (ex) ex.destroy();
    const counts = {};
    db.patients.forEach(p => { if (p.diagnosis && p.diagnosis !== '—') counts[p.diagnosis] = (counts[p.diagnosis]||0)+1; });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7);
    const hasData = sorted.length > 0;
    new Chart(topCtx, { type:'bar', data:{ labels: hasData ? sorted.map(x=>x[0]) : ['No data'], datasets:[{ data: hasData ? sorted.map(x=>x[1]) : [0], backgroundColor:'#00c8ff', borderRadius:6, borderWidth:0 }] }, options:{ indexAxis:'y', responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a6280',stepSize:1,precision:0},beginAtZero:true}, y:{grid:{display:false},ticks:{color:'#4a6280',font:{size:11}}} } } });
  }
  const ageCtx = document.getElementById('ageChart');
  if (ageCtx) {
    const ex = Chart.getChart(ageCtx); if (ex) ex.destroy();
    const groups = { '0-18':0, '19-30':0, '31-45':0, '46-60':0, '61+':0 };
    db.patients.forEach(p => { const a=parseInt(p.age); if(a<=18)groups['0-18']++; else if(a<=30)groups['19-30']++; else if(a<=45)groups['31-45']++; else if(a<=60)groups['46-60']++; else groups['61+']++; });
    new Chart(ageCtx, { type:'bar', data:{ labels:Object.keys(groups), datasets:[{ data:Object.values(groups), backgroundColor:['#00e5a0','#00c8ff','#0066ff','#ffd166','#ff6b9d'], borderRadius:6, borderWidth:0 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#4a6280'}}, y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a6280',stepSize:1,precision:0},beginAtZero:true} } } });
  }
}

// ── SETTINGS ──────────────────────────────────────────────────
function saveApiUrl() {
  const url = document.getElementById('apiUrl').value.trim();
  API = url;
  localStorage.setItem('mediaiApiUrl', url);
  const status = document.getElementById('connectionStatus');
  status.innerHTML = '<span style="color:var(--muted)">Testing...</span>';
  fetch(url).then(r=>r.json()).then(()=>{ status.innerHTML='<span style="color:var(--green)">✅ Connected!</span>'; showToast('Backend connected!','success'); }).catch(()=>{ status.innerHTML='<span style="color:var(--red)">❌ Connection failed.</span>'; });
}

function refreshSettings() {
  const db = getDB();
  const p=document.getElementById('dbPatients'); if(p) p.textContent=db.patients.length;
  const d=document.getElementById('dbDiagnoses'); if(d) d.textContent=db.patients.length;
  const ds=document.getElementById('dbDiseases'); if(ds) ds.textContent=db.diseases.length;
}

function clearDatabase() {
  if (!confirm('This will delete ALL patient data. Are you sure?')) return;
  localStorage.removeItem('mediai_patients');
  localStorage.removeItem('mediai_diseases');
  localStorage.removeItem('mediai_scans');
  showToast('Database cleared', 'error');
  setTimeout(() => { refreshSettings(); refreshDashboard(); renderDiseaseGrid(); renderPatientsTable(); }, 100);
}

// ── USER MANAGEMENT ───────────────────────────────────────────
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API}/auth/users`);
    const data = await res.json();
    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td><code style="color:var(--accent)">${u.username}</code></td>
        <td><strong>${u.full_name}</strong></td>
        <td><span class="card-badge">${u.role}</span></td>
        <td style="color:var(--muted)">${formatDate(u.created_at)}</td>
        <td style="color:var(--muted)">${u.last_login ? formatDate(u.last_login) : 'Never'}</td>
        <td>${u.username !== 'admin'
          ? `<button class="tbl-btn del" onclick="deleteUser('${u.username}')">🗑 Delete</button>`
          : '<span style="color:var(--muted);font-size:0.75rem">Protected</span>'}</td>
      </tr>`).join('');
  } catch(err) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:1rem">Backend not connected. Start Flask server.</td></tr>';
  }
}

async function createUser() {
  const full_name = document.getElementById('new_fullname').value.trim();
  const username  = document.getElementById('new_username').value.trim();
  const password  = document.getElementById('new_password').value.trim();
  const role      = document.getElementById('new_role').value;
  const msgEl     = document.getElementById('addUserMsg');

  if (!full_name || !username || !password) {
    msgEl.textContent = 'All fields are required';
    msgEl.style.display = 'block';
    msgEl.style.background = 'rgba(255,77,109,0.1)';
    msgEl.style.color = '#ff4d6d';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password, full_name, role }) });
    const data = await res.json();
    if (data.success) {
      document.getElementById('addUserModal').style.display = 'none';
      ['new_fullname','new_username','new_password'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
      msgEl.style.display = 'none';
      showToast(`User ${full_name} created`, 'success');
      loadUsers();
    } else {
      msgEl.textContent = data.error || 'Registration failed';
      msgEl.style.display = 'block';
      msgEl.style.background = 'rgba(255,77,109,0.1)';
      msgEl.style.color = '#ff4d6d';
    }
  } catch(err) {
    msgEl.textContent = 'Backend not connected';
    msgEl.style.display = 'block';
  }
}

async function deleteUser(username) {
  if (!confirm(`Delete user "${username}"?`)) return;
  try {
    const res = await fetch(`${API}/auth/users/${username}`, { method:'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('User deleted', 'error'); loadUsers(); }
  } catch(err) { showToast('Error deleting user', 'error'); }
}

// ── IMAGE ANALYSIS ────────────────────────────────────────────
function selectScanType(type, btn) {
  currentScanType = type;
  document.querySelectorAll('.scan-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('scanTypeLabel');
  if (label) label.textContent = SCAN_LABELS[type] || type;
}

function handleImageSelect(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    currentImageB64 = dataUrl.split(',')[1];
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const nameEl = document.getElementById('imgFileName');
    const sizeEl = document.getElementById('imgFileSize');
    const infoEl = document.getElementById('imageInfo');
    const btn = document.getElementById('analyzeImageBtn');
    if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = (file.size/1024).toFixed(1) + ' KB';
    if (infoEl) infoEl.style.display = 'block';
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    showToast('Image loaded — ready to analyze!', 'success');
  };
  reader.readAsDataURL(file);
}

async function analyzeImage() {
  if (!currentImageB64) { showToast('Please upload an image first', 'error'); return; }
  const panel = document.getElementById('imgResultPanel');
  panel.style.alignItems = 'stretch';
  panel.style.justifyContent = 'flex-start';
  panel.innerHTML = `<div style="padding:2rem;text-align:center"><div style="font-size:2.5rem;margin-bottom:1rem;display:inline-block;animation:spin 1s linear infinite">⚙️</div><h3 style="font-family:'Clash Display';margin-bottom:0.5rem">Analyzing Image</h3><p style="color:var(--muted);font-size:0.85rem">Running AI model on your scan...</p></div>`;
  const probPanel = document.getElementById('probChartPanel');
  if (probPanel) probPanel.style.display = 'none';
  try {
    const res = await fetch(`${API}/predict/image`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ disease_type: currentScanType, image: currentImageB64 }) });
    const data = await res.json();
    if (data.error) { panel.innerHTML = `<div style="padding:1.5rem;color:var(--red)">❌ ${data.error}</div>`; return; }
    const isNormal = data.result.toLowerCase().includes('normal') || data.result.toLowerCase().includes('no ') || data.result.toLowerCase().includes('benign');
    const color = isNormal ? 'var(--green)' : 'var(--red)';
    const icon  = isNormal ? '✅' : '⚠️';
    panel.innerHTML = `
      <div style="padding:0.75rem">
        <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">
          <img src="data:image/jpeg;base64,${currentImageB64}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;flex-shrink:0;border:1px solid var(--border)"/>
          <div>
            <div style="font-size:0.7rem;color:var(--muted);font-weight:600;text-transform:uppercase;margin-bottom:0.3rem">${data.description}</div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span style="font-size:1.3rem">${icon}</span>
              <h3 style="font-family:'Clash Display';color:${color};font-size:1.15rem;margin:0">${data.result}</h3>
            </div>
          </div>
        </div>
        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem">
            <span style="font-size:0.78rem;color:var(--muted);font-weight:600">CONFIDENCE</span>
            <span style="font-size:0.78rem;font-weight:700;color:${color}">${data.confidence}%</span>
          </div>
          <div class="conf-bar"><div class="conf-fill" style="width:${data.confidence}%;background:${isNormal?'linear-gradient(90deg,#00a070,var(--green))':'linear-gradient(90deg,#c00,var(--red))'}"></div></div>
        </div>
        <div style="background:${isNormal?'rgba(0,229,160,0.08)':'rgba(255,77,109,0.08)'};border:1px solid ${isNormal?'rgba(0,229,160,0.25)':'rgba(255,77,109,0.25)'};border-radius:10px;padding:1rem;margin-bottom:1rem">
          <div style="font-size:0.72rem;color:var(--muted);font-weight:600;text-transform:uppercase;margin-bottom:0.35rem">RECOMMENDATION</div>
          <p style="font-size:0.88rem;line-height:1.5;margin:0">${data.recommendation}</p>
        </div>
        <p style="font-size:0.72rem;color:var(--muted);text-align:center">⚠️ For informational purposes only. Always consult a qualified medical professional.</p>
      </div>`;
    renderProbChart(data.all_probabilities);
    saveRecentScan(data);
    showToast(`Result: ${data.result} (${data.confidence}%)`, isNormal ? 'success' : 'error');
  } catch(err) {
    panel.innerHTML = `<div style="padding:1.5rem"><div style="color:var(--red);margin-bottom:0.5rem">❌ Backend not connected</div><div style="color:var(--muted);font-size:0.82rem">Run: <code>python3 app.py</code></div></div>`;
  }
}

function renderProbChart(probs) {
  const panel = document.getElementById('probChartPanel');
  if (panel) panel.style.display = 'block';
  const ctx = document.getElementById('probChart');
  if (!ctx) return;
  const ex = Chart.getChart(ctx); if (ex) ex.destroy();
  const labels = Object.keys(probs), values = Object.values(probs);
  const colors = ['#00c8ff','#0066ff','#00e5a0','#ffd166','#ff6b9d','#a78bfa'];
  new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ data:values, backgroundColor:labels.map((_,i)=>colors[i%colors.length]), borderRadius:6, borderWidth:0 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#4a6280',font:{size:11}}}, y:{min:0,max:100,grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a6280',callback:v=>v+'%'}} } } });
}

function saveRecentScan(data) {
  const scan = { type:currentScanType, result:data.result, confidence:data.confidence, fullImage:currentImageB64, date:new Date().toISOString(), label:SCAN_LABELS[currentScanType]||currentScanType };
  recentScans.unshift(scan);
  if (recentScans.length > 10) recentScans = recentScans.slice(0,10);
  localStorage.setItem('mediai_scans', JSON.stringify(recentScans));
  renderRecentScans();
}

function renderRecentScans() {
  const container = document.getElementById('recentScans');
  if (!container) return;
  if (!recentScans.length) { container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:1rem">No scans yet.</p>'; return; }
  container.innerHTML = recentScans.slice(0,5).map(s => {
    const isNormal = s.result.toLowerCase().includes('normal') || s.result.toLowerCase().includes('no ') || s.result.toLowerCase().includes('benign');
    return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:var(--bg2);border-radius:8px;margin-bottom:0.5rem;font-size:0.82rem">
      <img style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0" src="data:image/jpeg;base64,${s.fullImage}" onerror="this.style.display='none'"/>
      <div style="flex:1;min-width:0"><strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</strong><span style="color:var(--muted);font-size:0.72rem">${formatDate(s.date)}</span></div>
      <div style="text-align:right"><strong style="display:block;font-size:0.8rem;color:${isNormal?'var(--green)':'var(--red)'}">${s.result}</strong><span style="color:var(--muted);font-size:0.7rem">${s.confidence}%</span></div>
    </div>`;
  }).join('');
}

function clearScans() {
  recentScans = [];
  localStorage.removeItem('mediai_scans');
  renderRecentScans();
  showToast('Scan history cleared', 'success');
}

// ── UTILS ─────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' });
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set user info from session
  if (currentUser) {
    const initials = currentUser.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const sName = document.getElementById('sidebarName');
    const sRole = document.getElementById('sidebarRole');
    const sAvatar = document.getElementById('sidebarAvatar');
    const tName = document.getElementById('topbarName');
    const tRole = document.getElementById('topbarRole');
    const tAvatar = document.getElementById('topbarAvatar');
    if (sName) sName.textContent = currentUser.full_name;
    if (sRole) sRole.textContent = currentUser.role;
    if (sAvatar) sAvatar.textContent = initials;
    if (tName) tName.textContent = currentUser.full_name;
    if (tRole) tRole.textContent = currentUser.role;
    if (tAvatar) tAvatar.textContent = initials;
  }

  // Init symptom input enter key
  const inp = document.getElementById('symptomInput');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addSymptom(); });

  renderTags();
  refreshDashboard();
  renderAccuracyChart();
  renderDiseaseGrid();
  renderRecentScans();
});

// ── AI CHAT ───────────────────────────────────────────────────
let chatHistory = [];
let isChatLoading = false;

const MEDICAL_SYSTEM_PROMPT = `You are MediAI Assistant, an expert medical information chatbot built into the MediAI Disease Prediction System. You help users understand:
- Symptoms and what they might indicate
- Diseases, their causes, and treatments
- Medical procedures and tests (X-rays, MRI, blood tests, etc.)
- Medications and their general uses
- General health, wellness, and prevention tips
- How to interpret common lab values (general guidance)
- When to seek emergency care

Guidelines:
- Be warm, clear, and professional
- Use simple language, avoid excessive jargon
- Always recommend consulting a doctor for personal medical decisions
- For emergency symptoms (chest pain, difficulty breathing, stroke signs), always say to call emergency services immediately
- Format responses clearly using bullet points or numbered lists when appropriate
- Keep responses concise but thorough
- Never diagnose — provide general information only`;

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendQuickPrompt(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message || isChatLoading) return;

  input.value = '';
  isChatLoading = true;

  // Add user message to UI
  appendMessage('user', message);

  // Add to history
  chatHistory.push({ role: 'user', content: message });

  // Hide quick prompts after first message
  const qp = document.getElementById('quickPrompts');
  if (qp) qp.style.display = 'none';

  // Show typing indicator
  showTyping();

  // Update send button
  const btn = document.getElementById('sendBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: MEDICAL_SYSTEM_PROMPT,
        messages: chatHistory
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    // Add assistant reply to history
    chatHistory.push({ role: 'assistant', content: reply });

    // Remove typing indicator and show reply
    removeTyping();
    appendMessage('assistant', reply);

  } catch (err) {
    removeTyping();
    appendMessage('assistant', '❌ Sorry, I could not connect to the AI service. Please check your internet connection and try again.');
  }

  isChatLoading = false;
  btn.disabled = false;
  btn.textContent = 'Send ➤';
  input.focus();
}

function appendMessage(role, content) {
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

  // Get user initials for avatar
  const userInitials = currentUser
    ? currentUser.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
    : 'U';

  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;

  // Format the content — convert markdown-style to HTML
  const formatted = formatChatText(content);

  if (role === 'assistant') {
    div.innerHTML = `
      <div class="chat-avatar assistant-avatar">🤖</div>
      <div>
        <div class="chat-bubble assistant-bubble">${formatted}</div>
        <div class="chat-time">${now}</div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="chat-avatar user-avatar">${userInitials}</div>
      <div>
        <div class="chat-bubble user-bubble">${escapeHtml(content)}</div>
        <div class="chat-time">${now}</div>
      </div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function formatChatText(text) {
  return text
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code `text`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Bullet lists
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>(\n|$))+/g, match => `<ul style="margin:0.4rem 0 0.4rem 1.2rem;display:flex;flex-direction:column;gap:0.2rem">${match}</ul>`)
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.+)$/, '<p>$1</p>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function showTyping() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.id = 'typingMsg';
  div.innerHTML = `
    <div class="chat-avatar assistant-avatar">🤖</div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typingMsg');
  if (el) el.remove();
}

function clearChat() {
  if (!confirm('Clear chat history?')) return;
  chatHistory = [];
  const container = document.getElementById('chatMessages');
  container.innerHTML = `
    <div class="chat-msg assistant">
      <div class="chat-avatar assistant-avatar">🤖</div>
      <div>
        <div class="chat-bubble assistant-bubble">
          <p>Chat cleared! How can I help you today?</p>
        </div>
      </div>
    </div>`;
  // Show quick prompts again
  const qp = document.getElementById('quickPrompts');
  if (qp) qp.style.display = 'flex';
  showToast('Chat cleared', 'success');
}