# 🚀 Production Deployment Guide: ReguComply AI

This document provides a comprehensive runbook for deploying the **AI-Powered Regulatory Compliance Communication System** into production.

---

## 🏗️ Architecture Overview

The application is engineered to be **self-contained and zero-ops**:
- **Unified Single-Port Deployment:** The FastAPI backend serves both the REST API (`/api/*`) and the compiled React 18 production Single Page Application (`/`) on a single port (default: `8000`).
- **Zero CORS Issues:** In production, client and server share the same origin.
- **Persistent Data:** SQLite (in WAL concurrency mode) and Memento conversation memory databases reside in `/app/backend/data`.

```
Internet / Users ──> [ Reverse Proxy / Cloud Load Balancer (Port 80/443) ]
                               │
                               ▼
                     [ FastAPI Container (Port 8000) ]
                     ├── /               ──> React SPA (frontend/dist)
                     ├── /api/*          ──> REST Endpoints (FastAPI)
                     ├── /health         ──> Healthcheck Probe
                     └── /backend/data/  ──> Persistent Volume (compliance.db + memento/)
```

---

## 📋 Production Environment Variables

Configure these variables in your deployment environment or `.env` file:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `SECRET_KEY` | **Yes** | 32-byte cryptographically secure hex key for JWT signing | `openssl rand -hex 32` |
| `FIRECRAWL_API_KEY` | **Yes** | API key for regulatory circular web scraping | `fc-your-key-here` |
| `FIRECRAWL_BASE_URL` | No | Base URL for Firecrawl API | `https://api.firecrawl.dev` |
| `LLM_PROVIDER` | No | AI provider (`gemini` or `openai`) | `gemini` (Default) |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key (if `LLM_PROVIDER=gemini`) | `AIzaSy...` |
| `GEMINI_MODEL` | No | Gemini model name | `gemini-3.8-flash` |
| `OPENAI_API_KEY` | Optional | OpenAI API Key (if `LLM_PROVIDER=openai`) | `sk-proj-...` |
| `DATABASE_URL` | No | SQLite database connection string | `sqlite:////app/backend/data/compliance.db` |
| `MEMENTO_STORAGE_DIR`| No | Directory path for employee memory databases | `/app/backend/data/memento` |
| `CORS_ORIGINS` | No | Allowed CORS origins (comma-separated) | `*` (or your domain) |
| `PORT` | No | Listening port for the application | `8000` |

> [!IMPORTANT]
> To generate a secure `SECRET_KEY` on your production server, run:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## 🐳 Option 1: Docker Compose (Recommended)

Ideal for deploying on **AWS EC2, DigitalOcean Droplet, Hetzner, Linode, or any Linux VPS**.

### 1. Clone Repository & Set Environment
```bash
git clone https://github.com/satish2006sahu-svg/Compliance-Communication-System.git
cd Compliance-Communication-System

# Create your production .env file
cp .env.example .env
nano .env  # Add your SECRET_KEY, FIRECRAWL_API_KEY, and GEMINI_API_KEY
```

### 2. Build & Launch Containers
```bash
docker compose up -d --build
```

### 3. Verify Health & Logs
```bash
# Check running status
docker compose ps

# Inspect logs
docker compose logs -f

# Verify HTTP health check
curl -f http://localhost:8000/health
```

The application is now live at `http://<your-server-ip>:8000` with automated persistent volume storage (`regucomply-data`).

---

## ☁️ Option 2: Cloud PaaS (Render, Railway, Fly.io)

### Render.com
1. Connect your GitHub repository to Render as a **Web Service**.
2. Select **Docker** as the environment (Render will automatically detect `Dockerfile`).
3. Set your environment variables in the Render dashboard:
   - `SECRET_KEY`
   - `FIRECRAWL_API_KEY`
   - `GEMINI_API_KEY`
   - `LLM_PROVIDER="gemini"`
4. **Attach a Persistent Disk:**
   - Go to **Disks** in Render dashboard.
   - Name: `compliance-data`
   - Mount Path: `/app/backend/data`
   - Size: `1 GB` (or larger)
5. Click **Deploy**. Render will build the React frontend and launch FastAPI automatically.

### Railway.app
1. Click **New Project** ➔ **Deploy from GitHub repo**.
2. In **Variables**, add your `SECRET_KEY`, `FIRECRAWL_API_KEY`, and `GEMINI_API_KEY`.
3. In **Settings** ➔ **Volumes**, add a Volume mounted at `/app/backend/data`.
4. Railway will build and deploy using the root `Dockerfile`.

---

## 🖥️ Option 3: Direct Linux Server (Systemd + Nginx)

For deploying directly on an Ubuntu/Debian server without Docker:

### 1. Install Prerequisites
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm nginx
```

### 2. Build Frontend & Setup Python Virtual Environment
```bash
cd /opt/Compliance-Communication-System

# Build React Frontend
cd frontend
npm ci
npm run build
cd ..

# Setup Python Environment
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Setup Systemd Service
Create `/etc/systemd/system/regucomply.service`:
```ini
[Unit]
Description=ReguComply AI Application Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/Compliance-Communication-System/backend
EnvironmentFile=/opt/Compliance-Communication-System/backend/.env
ExecStart=/opt/Compliance-Communication-System/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable regucomply
sudo systemctl start regucomply
```

### 4. Setup Nginx Reverse Proxy with SSL
Create `/etc/nginx/sites-available/compliance.conf`:
```nginx
server {
    listen 80;
    server_name compliance.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and acquire free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/compliance.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d compliance.yourdomain.com
```

---

## 💾 Database Backup & Maintenance

Because SQLite is running in **Write-Ahead Logging (WAL)** mode, never copy `compliance.db` directly while write transactions are active. Use SQLite's online vacuum backup command:

### Safe Online Database Backup
```bash
# Safe backup command (can run while app is live)
sqlite3 /app/backend/data/compliance.db "VACUUM INTO '/app/backend/data/backup_$(date +%F).db'"

# Backup Memento memory directory
tar -czvf /app/backend/data/memento_backup_$(date +%F).tar.gz /app/backend/data/memento/
```

### Default Accounts Seeded on First Run
- **Administrator:** `admin@compliance.org` / `AdminPassword2026!`
- **Employee 1:** `employee1@compliance.org` / `EmployeePass2026!`
- **Employee 2:** `employee2@compliance.org` / `EmployeePass2026!`

*(Remember to change default passwords immediately after initial deployment.)*
