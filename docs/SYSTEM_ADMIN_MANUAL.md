# SYSTEM ADMINISTRATOR GUIDE (MANUAL)
**System:** CARS Manager v2.5
**Access Level:** System Administrator / HSE Manager

---

## 1. System Logic Overview
The **CARS Manager** is not just a database; it is a Logic Engine. Understanding how it calculates "Compliance" is critical.

### 🚦 The Traffic Light Logic
The system grants a **GREEN (Granted)** status only if all three conditions are met:
`[👤 User Active] + [🏥 ASO Valid] + [🎓 RACs Valid] = ✅ ACCESS GRANTED`

---

## 2. Branding & Personalization (NEW)
Enterprise Admins can now customize the application environment to match their internal corporate standards.

### 🎨 Tenant Identity
1.  **Go to Settings > Branding.**
2.  **App Name:** Set a custom title (e.g., "SafeWork Portal"). This name replaces "CARS" or "RACS" in the sidebar and main header.
3.  **Safety Logo:** Upload a "Safety First" or site-specific badge. This overrides the default system icons in branded zones.
4.  **Save:** Click **"Save Branding"** to apply changes across all site instances for your tenant.

---

## 3. Core Workflows
### Workflow A: Onboarding & Matrix Setup
1.  **Go to Database.**
2.  **Import:** Click "Import Wizard" to upload a CSV. The system maps columns automatically.
3.  **The Matrix:** Toggle RAC buttons to set requirements. **Grey** = Optional, **Green** = Mandatory.

### Workflow B: Scheduling & Booking
1.  **Go to Schedule** to create training slots.
2.  **Go to Book Training.**
3.  **Smart Capacity:** If you exceed room capacity, the system automatically suggests the next available date or adds students to a **Waitlist**.

---

## 4. Robotic Self-Healing
CARS v2.5 features an automated resilience layer.

### 🤖 RoboTech Protocols
*   **Auto-Recovery:** If the UI crashes, a "Robotic Intervention" screen appears. The system attempts to diagnose the stack trace using Gemini AI and performs a soft-state reset.
*   **Active Diagnostics:** Administrators can trigger a manual system scan in **Settings > Diagnostics** to optimize database latency and memory shards.

---

## 5. Troubleshooting
| Issue | Visual | Solution |
| :--- | :---: | :--- |
| **Translation Error** | 🌐 | If keys are missing in Portuguese, the system fails-safe to English automatically. |
| **Branding Not Updating** | 🎨 | Ensure you click "Save Branding" inside the Branding tab specifically. |
| **Access Blocked** | ❌ | Check ASO date. An expired medical always blocks access, regardless of training. |