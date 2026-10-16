# HAZTRACK — Hazardous Waste Management & Tracking System

> **College Project**: Department of Information Technology, **Easwari Engineering College**  
> **Brand**: HAZTRACK // SECURE CHAIN  
> **Core Principle**: TRACK → MONITOR → DETECT → ALERT → ACT → INVESTIGATE → RESOLVE → AUDIT  
> **Standard**: Central Pollution Control Board (CPCB) Rule 19 Hazardous Waste Tracking Compliance

---

## 🌟 Overview & System Principle

HAZTRACK is a centralized, real-time hazardous waste monitoring, containment, and regulatory compliance platform. It enforces cryptographic chain-of-custody tracking across the entire hazardous lifecycle:

```
[ GENERATION ] ──▶ [ COLLECTION ] ──▶ [ TRANSPORT (GPS) ] ──▶ [ RECEIVING ] ──▶ [ TREATMENT ] ──▶ [ FINAL DISPOSAL ]
```

The system actively detects mass balance discrepancies, transit delays, emergency incidents, and regulatory non-compliance, triggering targeted Socket.IO alerts and dynamic AI Voice synthesizers.

---

## 👥 Authenticated Stakeholder Directory

All 7 official stakeholders are configured with unique user IDs, distinct usernames, bcrypt-hashed credentials, and role-enforced API permissions:

| User ID | Full Name | Username | Role | Organization Name |
| :--- | :--- | :--- | :--- | :--- |
| **HZU-001** | Harinitha | `harinitha_admin` | **ADMIN** | HazTrack Central Control & Compliance (EEC) |
| **HZU-002** | Rinitha | `rinitha_lab` | **LABORATORY** | Apex Chemical R&D Labs |
| **HZU-003** | Harini | `harini_industry` | **INDUSTRY** | Titan Petrochemicals Ltd. |
| **HZU-004** | Rini | `rini_transporter` | **TRANSPORTER** | EcoHaul Hazmat Transport Logistics |
| **HZU-005** | Shravan | `shravan_transporter` | **TRANSPORTER** | Vanguard Hazmat Fleet Express |
| **HZU-006** | Ravan | `ravan_facility` | **TREATMENT_FACILITY** | GreenSafe Neutralization & Recovery Plant |
| **HZU-007** | Avan | `avan_facility` | **TREATMENT_FACILITY** | BioClean High-Temp Incineration Facility |

> **Default Demo Password for All Users**: `HazTrack@2026!`  
> *(Convenient 1-click test selector available on the login page)*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts, Socket.IO Client, HTML5-QRCode.
- **Backend**: Node.js, Express.js (ESM), TypeScript, Socket.IO, JWT, BcryptJS, Multer, QRCode.
- **Database**: MongoDB & Mongoose with embedded high-performance memory fallback for zero-setup execution.
- **Engines**: Smart Monitoring & Discrepancy Engine, Tactical AI Voice HUD, Append-Only Audit Ledger.

---

## 🚀 Quick Start Guide

### 1. Start the Backend Server (Port 5000)
```bash
cd backend
node dist/server.js
```

### 2. Start the Frontend Dev Server (Port 5173)
```bash
cd frontend
npm run dev
```

### 3. Access Platform in Browser
Open `http://localhost:5173` to explore the Landing Page or log in at `http://localhost:5173/login`.

---

## 🔬 Core Features & Workflows Demonstrated

1. **Strict Forward-Only Lifecycle**: Enforces `REGISTERED` → `COLLECTION_REQUESTED` → `IN_TRANSIT` → `RECEIVED` → `TREATED` → `DISPOSED`.
2. **Mass Balance & Discrepancy Engine**: Compares Generator Declared vs Transporter Collected vs Facility Received mass; automatically opens investigation case on variances $\ge 0.5\text{ kg}$.
3. **Emergency Road Incident Dispatch**: Transporters report breakdown/spill incidents, triggering immediate priority alerts and AI voice warnings.
4. **Interactive Case Resolver**: Admin reviews evidence, requests explanations, and issues verdicts (`EXPLANATION_ACCEPTED`, `VIOLATION_CONFIRMED`).
5. **Cryptographic QR Tokens**: High-definition QR manifest generation and optical scanner for field verification.
6. **Immutable Audit Ledger**: Tamper-proof compliance history tracking every state mutation.
