# Red Relay - Emergency Blood Logistics Network

A decentralized, AI-augmented, and fraud-resistant emergency blood network connecting Hospitals, Donors, Blood Banks, and Volunteer NGOs in real-time.

---

## 📁 Project Architecture

The project is cleanly structured into separate **Frontend** and **Backend** directories with root workspace integration:

```text
Technathon/
├── frontend/                # React 19 + Vite + TailwindCSS Frontend
│   ├── src/                 # Views, components, contexts, and API clients
│   ├── public/              # Public static assets & icons
│   ├── index.html           # Single Page Application entry HTML
│   ├── vite.config.js       # Vite configuration with /api reverse proxy
│   ├── package.json         # Frontend dependencies and scripts
│   └── .oxlintrc.json       # Linter configuration
│
├── backend/                 # Node.js + Express REST & SSE Backend
│   ├── routes/              # Modular Express API routes
│   ├── services/            # Matching, fraud detection & SSE notification services
│   ├── data/                # Data store & seed mock dataset
│   ├── test/                # API integration test suite
│   ├── index.js             # Express server entry point (port 5000)
│   ├── package.json         # Backend dependencies and scripts
│   └── .env.example         # Backend environment variables
│
├── package.json             # Root monorepo workspace runner
└── README.md                # Documentation
```

---

## 🚀 Quick Start

### 1. Install All Dependencies
From the repository root:
```bash
npm install
```
*(This automatically installs dependencies across both `frontend` and `backend` workspaces)*

### 2. Run Both Frontend and Backend Concurrently
From the repository root:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🛠️ Running Services Individually

### Running Only the Backend
```bash
# From root:
npm run dev:backend

# Or directly in the backend folder:
cd backend
npm run dev
```

### Running Only the Frontend
```bash
# From root:
npm run dev:frontend

# Or directly in the frontend folder:
cd frontend
npm run dev
```

### Testing the Backend API
```bash
# Ensure the backend server is running, then run:
npm run test
```

### Building for Production
```bash
npm run build
```
