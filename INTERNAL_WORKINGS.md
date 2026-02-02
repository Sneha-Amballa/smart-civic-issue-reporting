# 🗺️ Mini Project - Complete System Architecture & Flow

This document details the exact internal working, data flow, API routes, and logic of the entire application.

---

# 1. 🏗️ Tech Stack Overview

- **Frontend**: React.js (Vite), Axios, CSS Variables (Theme system).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (Neon Tech Serverless).
- **AI Service**: Python (FastAPI), SentenceTransformers (MiniLM-L6-v2), PyTorch.
- **Storage**: Cloudinary (Image/Document CDN).
- **Auth**: JWT (JSON Web Tokens) & Email OTP.

---

# 2. 🚦 Authentication Flow

### **A. Citizen Signup & Login**
1.  **Frontend (`Login.jsx` / `Signup.jsx`)**:
    *   User enters Email.
    *   **API Call**: `POST /api/auth/login` (or `/signup`).
2.  **Backend (`authController.js`)**:
    *   Checks if user exists in `users` table.
    *   Generates a **6-digit OTP**.
    *   Stores OTP in DB (`users.otp`, `users.otp_expiry`).
    *   Sends Email via **Nodemailer** (`emailService.js`).
3.  **Verify OTP**:
    *   User enters code.
    *   **API Call**: `POST /api/auth/verify-otp` (or `/login-verify`).
    *   **Success**: Returns a **JWT Token**.
    *   **Token Payload**: `{ id, email, role: 'citizen' }`.

### **B. Admin Login (Secure)**
1.  **Frontend**:
    *   If email matches `ADMIN_EMAIL` (hardcoded in frontend/env), shows **Password Field**.
    *   **API Call**: `POST /api/auth/admin-login`.
2.  **Backend**:
    *   Checks `email` === `process.env.ADMIN_EMAIL`.
    *   Checks `password` === `process.env.ADMIN_SECRET`.
    *   **Success**: Returns JWT with `{ role: 'admin' }`.

---

# 3. 👮 Officer Registration & AI Screening Flow

This is a key feature where Officers act as "Field Agents" and must be approved.

1.  **Frontend (`OfficerRegister.jsx`)**:
    *   Officer fills form (Name, Dept, Phone) and **uploads a PDF/Image** proof.
    *   **API Call**: `POST /api/officer/register` (Multipart/Form-Data).

2.  **Backend (`officerController.js`)**:
    *   **Step 1 (Upload)**: File uploaded to **Cloudinary**. Get `secure_url`.
    *   **Step 2 (Text Extraction)**:
        *   If PDF: Use `pdf-parse`.
        *   If Image: Use `tesseract.js` (OCR).
    *   **Step 3 (AI Analysis)**:
        *   Backend calls Python AI: `POST http://localhost:8000/screen-officer`.
        *   Pyload: `{ department: "Roads", text: "extracted text..." }`.

3.  **AI Service (`main.py`) - /screen-officer**:
    *   **Model**: `all-MiniLM-L6-v2` (Sentence Embeddings).
    *   **Logic**:
        *   Converts "Department Description" (e.g., "Maintains city roads, potholes") into vector.
        *   Converts "Document Text" into vector.
        *   Calculates **Cosine Similarity**.
    *   **Result**: Returns `confidence_score` (0 to 1) and `reason`.

4.  **Backend Database**:
    *   Saves User to `users` table with:
        *   `role` = `'officer'`
        *   `account_status` = `'pending'`
        *   `ai_score` = `0.85` (example)
        *   `document_url` = `cloudinary_url`

5.  **Admin Approval**:
    *   Admin sees list at `/api/admin/pending-officers`.
    *   Admin clicks "Approve". DB updates `account_status` = `'active'`.

---

# 4. 📢 Issue Reporting (The Core Feature)

### **A. Citizen Reports Issue**
1.  **Frontend (`Dashboard.jsx`)**:
    *   User takes photo, speaks description (Web Speech API -> Text).
    *   Captures **Geolocation** (Lat/Lon).
    *   **API Call**: `POST /api/issues/report`.

2.  **Backend (`issueController.js`)**:
    *   **Validation**: Checks image & location.
    *   **Cloudinary**: Uploads Evidence Photo.
    *   **AI Categorization**:
        *   Calls Python AI: `POST http://localhost:8000/analyze`.
        *   Payload: `{ text: "Big pothole on main street", image: "base64..." }`.

3.  **AI Service (`main.py`) - /analyze**:
    *   Uses text embedding to find **Best Matching Department**.
    *   Example: "Pothole" -> matches "Road Department" vector.
    *   Returns: `{ category: "Roads", confidence: 0.92 }`.

4.  **Database**:
    *   Inserts into `issues` table.
    *   Status: `'Reported'`. Category: `'Roads'`.

### **B. Issue Routing (Who sees what?)**
*   **Citizen**: Sees *their own* issues (`GET /api/issues/my-issues`).
*   **Admin**: Sees *ALL* issues globally (`GET /api/admin/all-issues`).
*   **Officer**: Sees *ONLY* issues for their department (`GET /api/officer/my-department-issues`).
    *   *Logic*: `SELECT * FROM issues WHERE category = $officer_department`.

---

# 5. 🗄️ Database Schema (PostgreSQL)

### **Table: `users`**
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `email` | String | Unique Identifier |
| `role` | String | 'citizen', 'admin', 'officer' |
| `department` | String | For Officers (Roads, Water, etc.) |
| `account_status`| String | 'active', 'pending' (for officers) |
| `ai_score` | Float | AI Trust Score for Officer Docs |
| `otp` | String | Login Code |

### **Table: `issues`**
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | Serial | Primary Key |
| `citizen_id` | UUID | Who reported it (FK -> users) |
| `category` | String | Assigned by AI (Roads, Waste, etc.) |
| `status` | String | 'Reported', 'In Progress', 'Resolved' |
| `latitude` | Float | Location |
| `image` | String | Cloudinary URL |
| `ai_confidence` | Float | How sure the AI is |

---

# 6. 🔗 Full API Route List

### **Auth Routes (`/api/auth`)**
*   `POST /signup` - Register Citizen.
*   `POST /login` - Citizen Login (Send OTP).
*   `POST /verify-otp` - Finish Login (Get Token).
*   `POST /admin-login` - Admin Password Login.

### **Issue Routes (`/api/issues`)**
*   `POST /report` - Report new issue (Protected).
*   `GET /my-issues` - Get issues for logged-in citizen.
*   `GET /:id` - Get specific details.

### **Admin Routes (`/api/admin`)**
*   `GET /pending-officers` - List unapproved officers.
*   `GET /all-issues` - List ALL citizen reports.
*   `POST /approve/:id` - Approve officer.
*   `POST /reject/:id` - Reject officer.

### **Officer Routes (`/api/officer`)**
*   `POST /register` - Apply to be an officer.
*   `GET /my-department-issues` - Issues matching officer's dept.
*   `PATCH /issue/:id/status` - Update status (e.g., to "Resolved").

---

# 7. 🧠 AI Service Internals (`main.py`)

The AI is a separate microservice running on port **8000**.

### **Department Definitions**
It knows `Roads`, `Water`, `Electricity`, `Waste`, `Health`, etc. by pre-calculating embedding vectors for description keywords (e.g., "voltage", "cable" -> Electricity).

### **Endpoints**
1.  `/screen-officer`: Checks if uploaded document text matches the claimed department.
2.  `/analyze`: Classifies citizen complaint text into one of the known departments.

---

# 8. 🔄 End-to-End Life Cycle

1.  **Citizen** logs in -> Reports "Street light broken".
2.  **Backend** sends text to **AI**.
3.  **AI** says: "Category: Electricity".
4.  **Database** saves issue as "Electricity".
5.  **Electrical Officer** (logged in) sees this issue on their dashboard.
6.  **Officer** clicks "Resolve".
7.  **Status** updates to "Resolved".
8.  **Citizen** sees "Resolved" on their tracking screen.
