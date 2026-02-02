# 📘 Civic Issue Reporting Platform - Complete System Documentation

## 1. 🏗️ Tech Stack & Architecture

This project is a modern, AI-powered web application designed to streamline civic issue reporting and management.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite)** | Fast, component-based UI. Uses generic CSS for styling and `Axios` for API calls. |
| **Backend** | **Node.js + Express.js** | RESTful API server handling logic, authentication, and database interaction. |
| **Database** | **PostgreSQL (Neon Tech)** | Serverless Relational Database for storing users, issues, and metadata. |
| **AI Service** | **Python (FastAPI)** | Microservice using `SentenceTransformers` & `PyTorch` for NLP and vector embeddings. |
| **Storage** | **Cloudinary** | Cloud-based CDN for storing evidence photos and documents. |
| **Auth** | **JWT + Nodemailer** | Secure JSON Web Token authentication with Email OTP verification. |

---

## 2. 🗄️ Database Schema & Storage

The system uses a relational model with two primary tables: `users` and `issues`.

### **Table: `users`**
Stores all actors in the system: Citizens, Officers, and Admins.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),  -- Null for citizens (OTP only), Hash for Admins
    role VARCHAR(20) CHECK (role IN ('citizen', 'admin', 'officer')),
    
    -- Officer Specific Fields
    department VARCHAR(50),      -- e.g., 'Roads', 'Water'
    designation VARCHAR(100),
    account_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'REJECTED'
    document_url TEXT,           -- Link to proof document on Cloudinary
    ai_score FLOAT,              -- AI Confidence Score (0.0 - 1.0)
    ai_reason TEXT,              -- Why AI approved/flagged this officer
    
    otp VARCHAR(6),
    otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Table: `issues`**
Stores reports submitted by citizens.

```sql
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    citizen_id UUID REFERENCES users(id),
    
    -- Issue Data
    category VARCHAR(50),        -- 'Roads', 'Water', 'Electricity', etc.
    voice_text TEXT,             -- Transcribed description
    image TEXT,                  -- Cloudinary Secure URL
    latitude FLOAT,
    longitude FLOAT,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'Reported', -- 'Reported', 'In Progress', 'Resolved', 'Flagged'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- AI Analysis Metadata
    ai_status VARCHAR(20),       -- 'CATEGORIZED', 'FLAGGED'
    ai_confidence FLOAT,
    ai_reason TEXT
);
```

---

## 3. 🔄 Internal Logic Flows

### **A. Issue Reporting & AI Auto-Classification**
1.  **Input**: User uploads an image and speaks a description (e.g., "Huge pothole here").
2.  **Frontend**: 
    -   Converts speech to text (Web Speech API).
    -   Captures Geolocation.
    -   Sends specific payload to Backend.
3.  **Backend (`issueController.js`)**:
    -   Uploads image to **Cloudinary** -> Gets URL.
    -   Sends `text` + `image` to **Python AI Service**.
4.  **AI Service (`main.py`)**:
    -   Converts text into specific **Vector Embeddings**.
    -   Compares against "Department Profiles" (Roads, Water, etc.).
    -   **Logic**:
        -   score > 0.4: `CATEGORIZED` (e.g., 'Roads').
        -   score < 0.25: `FLAGGED` (Spam/Irrelevant).
        -   Else: `UNCATEGORIZED`.
5.  **Storage**: Backend saves the issue with the AI-determined status and category.

### **B. Officer Verification System**
1.  **Frontend**: Officer fills form & uploads ID proof.
2.  **Backend**:
    -   Uploads ID to **Cloudinary**.
    -   Extracts text from ID (using `pdf-parse` or `tesseract.js`).
    -   Sends extracted text + Department name to **AI**.
3.  **AI Checking**:
    -   Does the ID text contain keywords related to the requested Department?
    -   Calculates "Trust Score".
4.  **Result**:
    -   High Score: Marked for Admin Review.
    -   Low Score: Auto-Flagged.

---

## 4. 🔗 API Documentation (Routes & Payloads)

### **Authentication (`/api/auth`)**

#### **1. Citizen Login (Send OTP)**
-   **Endpoint**: `POST /login`
-   **Body**: `{ "email": "user@example.com" }`
-   **Logic**: Generates 6-digit OTP, saves to DB, sends email.

#### **2. Verify OTP (Get Token)**
-   **Endpoint**: `POST /verify-otp`
-   **Body**: `{ "email": "user@example.com", "otp": "123456" }`
-   **Response**: `{ "token": "JWT_STRING", "role": "citizen" }`

#### **3. Admin Login**
-   **Endpoint**: `POST /admin-login`
-   **Body**: `{ "email": "admin@gov.in", "password": "secure_password" }`
-   **Note**: Validates against Environment Variables (`ADMIN_EMAIL`).

---

### **Issues (`/api/issues`)**

#### **1. Report New Issue**
-   **Endpoint**: `POST /report`
-   **Headers**: `Authorization: Bearer <TOKEN>`
-   **Body**:
    ```json
    {
        "image": "data:image/jpeg;base64,.....", 
        "voiceText": "Street light is broken near the park",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    ```
-   **Internal Flow**:
    -   Upload to Cloudinary.
    -   `POST http://localhost:8000/analyze` (AI).
    -   `INSERT INTO issues`.

#### **2. Get My Issues**
-   **Endpoint**: `GET /my-issues`
-   **Headers**: `Authorization: Bearer <TOKEN>`
-   **Response**: List of issues reported by this specific user.

---

### **Admin Management (`/api/admin`)**

#### **1. Get All Officers**
-   **Endpoint**: `GET /all-officers`
-   **Purpose**: Returns list of all officer applications (Active, Pending, Rejected).

#### **2. Approve/Reject Officer**
-   **Endpoint**: `POST /approve/:id` OR `POST /reject/:id`
-   **Effect**: Updates `account_status` in DB.

#### **3. View All Issues**
-   **Endpoint**: `GET /all-issues`
-   **Purpose**: Global view of every issue reported in the city.

---

## 5. 🛠 Environment Variables (`.env`)

These credentials are required for the system to function.

```env
# Server
PORT=5000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/civic_db?sslmode=require

# Authentication
JWT_SECRET=super_secret_jwt_key
ADMIN_EMAIL=admin@code.com
ADMIN_SECRET=admin123

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=xxxxxx
CLOUDINARY_API_KEY=xxxxxx
CLOUDINARY_API_SECRET=xxxxxx

# Email Service
EMAIL_USER=alerts@civicapp.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

---

## 6. 🚀 Running the Project

### **Backend (Node.js)**
```bash
cd backend
npm install
npm start
# Runs on localhost:5000
```

### **AI Service (Python)**
```bash
cd ai_service
pip install -r requirements.txt
python main.py
# Runs on localhost:8000
```

### **Frontend (React)**
```bash
cd frontend
npm install
npm start
# Runs on localhost:3000
```
