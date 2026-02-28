# Medivia 💊 — Medication Safety Hub

**Team Name:** Dual-Deploy

## Team Members
- **Member 1:** Nayana J Pillai — College of Engineering ,Chengannur
- **Member 2:** Shruthi Joe — College of Engineering ,Chengannur

## Hosted Project Link
> https://pulse-guard-three.vercel.app/

---

## Project Description
PulseGuard is a full-stack medication safety platform that detects fatal drug interactions in real time before they are logged, tracks dose compliance, and gives caregivers a live oversight dashboard. It connects patients with their medications and caregivers with their patients — protecting everyone in the chain.

---

## The Problem Statement
Every year, thousands of patients are hospitalised due to **preventable drug interactions** — combinations of medications that become toxic when taken together. Most people managing multiple medications have no reliable, real-time way to know if a new prescription dangerously conflicts with what they're already taking. Caregivers, elderly patients, and families managing complex medication routines are especially at risk.

---

## The Solution
PulseGuard acts as a **live medication safety shield**. Every time a new drug is added, it is instantly cross-referenced against the patient's full medication list using the NIH RxNav API. If a dangerous combination is detected, the entry is **blocked** and a multi-sensory alarm fires — red screen pulse, audio beeps, and a browser notification — with a full clinical explanation of why the combination is dangerous. Patients also get dose reminders, pharmacokinetic concentration graphs, emergency QR codes, and caregiver oversight.

---

## Technical Details

### Technologies / Components Used

**Languages:**
- JavaScript (React frontend)
- Python (Flask backend)
- SQL (SQLite via SQLAlchemy)

**Frameworks:**
- React 18 (frontend SPA)
- Flask (REST API backend)
- Flask-JWT-Extended (authentication)
- SQLAlchemy (ORM)
- APScheduler (background jobs)

**Libraries:**
- axios — HTTP client with JWT interceptor
- chart.js + react-chartjs-2 — pharmacokinetic concentration graphs
- qrcode.react — emergency QR code generation
- date-fns — date manipulation
- bcrypt — password hashing
- Web Audio API — interaction alarm sound (no file needed)
- Web Notifications API — browser push alerts

**External APIs (no API key required):**
- NIH RxNav API — drug identity (RxCUI) + interaction checking
- openFDA Drug Label API — indications, adverse reactions, boxed warnings

**Tools:**
- VS Code
- Git
- SQLite (development database)
- React Scripts (Create React App)

---

## Features

**Feature 1 — Fatal Interaction Shield**
Every new medication is checked pairwise and in bulk against the patient's existing drug list using NIH RxNav. HIGH severity or keyword-flagged interactions (fatal, contraindicated, serotonin syndrome, etc.) are blocked before saving. An alarm fires: red border pulse, 3 Web Audio beeps, and a browser notification with requireInteraction: true.

**Feature 2 — FDA Drug Encyclopedia (Live Lookup)**
As the user types a medication name (700ms debounce), PulseGuard fetches its FDA-approved label data — indications & usage, adverse reactions, and boxed warnings — displayed in colour-coded cards inside the Add Medication modal.

**Feature 3 — Dose Tracking + Smart Reminders**
Patients log doses (taken/skipped/missed) per medication. APScheduler checks every minute for overdue doses (>15 min past scheduled time) and fires browser alerts. Stock is auto-decremented on each logged dose. Low stock triggers alerts when below the configurable threshold.

**Feature 4 — Pharmacokinetic Concentration Graph**
Selecting any medication renders a live Chart.js graph of its bloodstream concentration curve using the formula C(t) = C0 x 0.5^(t / t-half), showing 3-dose accumulation and the next dose timing.

**Feature 5 — Caregiver Portal**
Caregivers link to multiple patients via email. They see a live dashboard of all linked patients — colour-coded red/yellow/green by status — with missed dose badges, low stock warnings, critical alert counts, compliance percentages, and a full "View Profile" modal showing medication details, dose history, and active alerts.

**Feature 6 — Emergency QR Code**
Patients can generate a full-screen QR code containing their name, all active medications with doses, frequencies, and boxed warning flags — JSON-encoded for paramedic scanning in an emergency.

---

## Implementation

### Installation

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

```bash
# Frontend (separate terminal)
cd frontend
npm install
```

### Run

```bash
# Terminal 1 — Backend (runs on port 5000)
cd backend
venv\Scripts\activate
python run.py
```

```bash
# Terminal 2 — Frontend (runs on port 3000)
cd frontend
npm start
```

> The React app proxies API requests to Flask via the `"proxy": "http://localhost:5000"` field in `package.json`. Open `http://localhost:3000` in your browser.

---

## Project Documentation

### Screenshots _(add your own after running the app)_

![Landing Page](screenshots/landing.png)
*PulseGuard landing page — features overview, How It Works section, and CTA. No fake statistics — only honest claims backed by real API integrations.*

![Patient Dashboard](screenshots/patient_dashboard.png)
*Patient dashboard showing the animated Safety Traffic Light (green/yellow/red), medication cards with overdue and low stock badges, one-click dose logging, and compliance ring.*

![Fatal Interaction Alarm](screenshots/interaction_alarm.png)
*The fatal interaction alarm triggered when a dangerous drug combo is attempted. Red pulsing screen border, skull icon, drug names, clinical description, and audio alert. The entry is completely blocked.*

![Add Medication Modal](screenshots/add_medication.png)
*Add Medication modal with live FDA lookup — boxed warnings in red, indications in blue, adverse reactions in amber — all fetched from openFDA in real time as the user types.*

![Caregiver Dashboard](screenshots/caregiver_dashboard.png)
*Caregiver dashboard showing linked patients with colour-coded status cards (green = stable, yellow = attention, red = critical), compliance percentages, and warning badges.*

![View Patient Profile](screenshots/patient_profile.png)
*Caregiver's View Patient Profile modal — full medication list with overdue/low stock indicators, recent dose history (taken / missed / skipped), and all active alerts.*

![Emergency QR Code](screenshots/emergency_qr.png)
*Emergency QR Code modal — full-screen QR encoding the patient's complete medication profile (name, all drugs, doses, warnings) for paramedic scanning.*

---

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND (React 18)                     │
│                                                              │
│  Pages: LandingPage · AuthPage · PatientDashboard           │
│         CaregiverDashboard                                   │
│                                                              │
│  Components: SafetyLight · MedCard · AddMedicationModal     │
│              InteractionAlarm · ConcentrationGraph          │
│              EmergencyQR · ViewPatientProfileModal          │
│                                                              │
│  Hooks: useAlertPolling (30s poll + browser notifications)  │
│  Utils: api.js (Axios + JWT Bearer interceptor)             │
└───────────────────────┬──────────────────────────────────────┘
                        │ Axios HTTP + JWT Bearer Token
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND (Flask)                          │
│                                                              │
│  Blueprints: /auth  /medications  /doses                    │
│              /caregiver  /alerts                            │
│                                                              │
│  Services: drug_api.py                                      │
│    - get_rxcui()         NIH RxNav name → CUI               │
│    - check_interactions() bulk + pairwise + keyword scan    │
│    - fetch_fda_drug_info() openFDA label lookup             │
│                                                              │
│  Background: APScheduler                                    │
│    - every 1 min → missed dose check → create Alert         │
│    - every 5 min → low stock scan  → create Alert           │
│                                                              │
│  Auth: Flask-JWT-Extended (HS256 access tokens)             │
└───────────────────────┬──────────────────────────────────────┘
                        │ SQLAlchemy ORM
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                          │
│                                                              │
│  users            id · email · password_hash · name · role  │
│  caregiver_links  caregiver_id · patient_id                 │
│  medications      patient_id · name · rxcui · form          │
│                   dose_amount · frequency_hours             │
│                   half_life_hours · current_stock · ...     │
│  dose_logs        medication_id · scheduled_time            │
│                   taken_time · status                       │
│  alerts           user_id · type · severity · title         │
│                   message · is_read                         │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTPS (no API key required)
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                   EXTERNAL APIs                               │
│                                                              │
│  NIH RxNav    rxnav.nlm.nih.gov/REST                        │
│    /rxcui.json              drug name → RxNorm CUI          │
│    /interaction/list.json   interaction check by CUIs       │
│    /spellingsuggestions.json fuzzy name matching            │
│                                                              │
│  openFDA      api.fda.gov/drug/label.json                   │
│    brand_name / generic_name search                         │
│    Returns: indications · adverse_reactions · boxed_warning │
└──────────────────────────────────────────────────────────────┘
```

### Application Workflow

```
USER ADDS MEDICATION
        │
        ├─ Typing name (700ms debounce)
        │       └─ GET /medications/fda-info?name=...
        │               └─ openFDA lookup
        │                       → Show boxed warnings (red)
        │                       → Show indications (blue)
        │                       → Show side effects (amber)
        │
        └─ Submit form → POST /medications/
                │
                ├─ 1. Resolve name to RxCUI (NIH RxNav)
                │
                ├─ 2. Bulk interaction check (all drugs at once)
                │
                ├─ 3. Pairwise checks (each existing drug)
                │
                ├─ 4. Keyword scan on descriptions
                │       (fatal / contraindicated / serotonin syndrome / etc.)
                │
                ├─ CRITICAL detected?
                │       YES → Return 409 FATAL_INTERACTION_BLOCKED
                │               → Frontend: InteractionAlarm fires
                │                   ├─ Red pulsing screen
                │                   ├─ Web Audio 3-beep alarm
                │                   ├─ Browser notification (requireInteraction)
                │                   └─ Modal: drug names + clinical description
                │
                └─ SAFE → Save to database
                          Schedule first dose (now + frequency_hours)
                          Return medication object

BACKGROUND JOBS (APScheduler)
  Every 1 minute:
    For each active medication where next_dose_time < now - 15min
    and no "taken" log exists → create missed dose Alert
    → notify patient + all linked caregivers

  Every 5 minutes:
    For each medication where current_stock <= stock_threshold
    → create low stock Alert
    → notify patient + all linked caregivers

FRONTEND POLLING (useAlertPolling hook)
  Every 30 seconds:
    GET /alerts/?unread=true
    If new alerts since last poll:
      → Update badge count
      → Fire browser notification per new alert
      → Critical alerts use requireInteraction: true
```

---

## API Documentation

**Base URL:** `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

### Authentication

**POST /auth/register**
```
Request:  { "name": "Jane", "email": "jane@x.com", "password": "pass123", "role": "patient" }
Response: { "token": "eyJ...", "user": { "id": 1, "name": "Jane", "role": "patient" } }
```

**POST /auth/login**
```
Request:  { "email": "jane@x.com", "password": "pass123" }
Response: { "token": "eyJ...", "user": { "id": 1, "name": "Jane", "role": "patient" } }
```

**GET /auth/me** _(protected)_
```
Response: { "id": 1, "name": "Jane", "email": "jane@x.com", "role": "patient" }
```

---

### Medications

**GET /medications/** _(protected)_
Returns all active medications for the logged-in patient.

**POST /medications/** _(protected)_
```
Request: {
  "name": "Warfarin",
  "form": "pill",
  "dose_amount": 5,
  "dose_unit": "mg",
  "frequency_hours": 24,
  "half_life_hours": 40,
  "current_stock": 30,
  "stock_threshold": 5
}

Response (interaction blocked — 409):
{
  "error": "FATAL_INTERACTION_BLOCKED",
  "message": "Dangerous interaction detected between Warfarin and Aspirin",
  "interactions": [
    {
      "severity": "high",
      "drugs": ["warfarin", "aspirin"],
      "description": "Increased bleeding risk...",
      "source": "DrugBank"
    }
  ]
}

Response (success — 201):
{ "id": 3, "name": "Warfarin", "rxcui": "11289", ... }
```

**GET /medications/fda-info?name=Warfarin** _(protected)_
```
Response: {
  "description": "Warfarin is indicated for...",
  "side_effects": "Bleeding, bruising...",
  "boxed_warnings": "WARNING: BLEEDING RISK...",
  "rxcui": "11289"
}
```

---

### Doses

**POST /doses/{med_id}/log** _(protected)_
```
Request:  { "status": "taken" }   // taken | skipped | missed
Response: { "id": 42, "status": "taken", "taken_time": "2026-02-28T10:00:00" }
```

**GET /doses/{med_id}/concentration** _(protected)_
```
Response: {
  "half_life": 40,
  "next_dose_time": "2026-02-28T14:00:00",
  "accumulation": [
    { "time": 0,  "concentration": 100.0 },
    { "time": 4,  "concentration": 93.3  },
    { "time": 8,  "concentration": 87.1  },
    ...
  ]
}
```

---

### Caregiver

**POST /caregiver/link-patient** _(protected, caregiver only)_
```
Request:  { "patient_email": "patient@example.com" }
Response: { "message": "Linked to patient Jane", "patient": { "id": 1, ... } }
```

**GET /caregiver/patients** _(protected, caregiver only)_
```
Response: [
  {
    "patient": { "id": 1, "name": "Jane", "email": "..." },
    "medications": [...],
    "compliance_percent": 87.5,
    "active_alerts": [...],
    "critical_alert_count": 1,
    "low_stock_meds": ["Metformin"],
    "has_missed_dose": true,
    "status": "yellow"
  }
]
```

**GET /caregiver/patient-profile/{patient_id}** _(protected, caregiver only)_
```
Response: {
  "patient": { "id": 1, "name": "Jane", "email": "..." },
  "medications": [...],
  "compliance_percent": 87.5,
  "recent_logs": [
    { "id": 10, "medication_name": "Warfarin", "status": "taken", "scheduled_time": "..." }
  ],
  "active_alerts": [...]
}
```

---

### Alerts

**GET /alerts/** _(protected)_
Returns all alerts. Add `?unread=true` to filter unread only.

**PUT /alerts/read-all** _(protected)_
Marks all alerts as read. Returns `{ "message": "All alerts marked as read" }`.

---

## AI Tools Used

**Tool Used:** Claude (Anthropic)

**Purpose:** Full-stack application scaffolding, component architecture, UI redesign, bug fixing, and iterative feature development throughout the hackathon.

**Key Prompts Used:**
- *"Build a Flask + React medication safety app with drug interaction checking using NIH RxNav API and FDA drug lookup"*
- *"The fatal interaction alarm isn't firing — fix the severity detection logic and add Web Audio API beeps with a full-screen pulsing red alarm modal"*
- *"Redesign the UI — more eye-appealing with animated safety traffic light, glassmorphism cards, staggered fade-up animations, and a dark theme"*
- *"Add a ViewPatientProfileModal so caregivers can see full patient medication history and dose logs — do not make other unnecessary changes"*
- *"Create a landing page without fake statistics — only honest claims based on real API integrations"*

**Percentage of AI-generated code:** ~70%

**Human Contributions:**
- Problem identification and feature prioritisation
- UX flow decisions and user story design
- Real drug name testing and API validation (Warfarin + Aspirin, Metformin + Lisinopril)
- Bug identification and iterative refinement prompting
- Integration testing between frontend and backend
- README and project documentation
- Deployment configuration

---

## Team Contributions
- **[Name 1]:** Frontend development — React component architecture, UI/UX design system, interaction alarm, pharmacokinetic graph, caregiver dashboard
- **[Name 2]:** Backend development — Flask API design, SQLAlchemy models, NIH RxNav + openFDA integration, APScheduler background jobs, JWT authentication

---

## License
This project is licensed under the **MIT License** — see the LICENSE file for details.

---

*Made with ❤️ at TinkerHub*

> ⚠️ **Medical Disclaimer:** PulseGuard is a safety awareness tool and is NOT a substitute for professional medical advice. Always consult your doctor or pharmacist before making any medication decisions.
