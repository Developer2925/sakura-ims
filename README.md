# Clinic System

Three independent apps in one workspace.

```
clinic-system/
  ├── mobile-app/     Expo (React Native) — clinic staff mobile app
  ├── admin-panel/    Vite + React        — admin dashboard (web)
  └── backend/        Node.js + Express   — shared API server (port 3001)
```

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm start          # runs on http://localhost:3001
```

### 2. Admin Panel
```bash
cd admin-panel
npm install
npm run dev        # runs on http://localhost:5173
```

### 3. Mobile App
```bash
cd mobile-app
npm install
npx expo start --clear
```

---

## Environment Variables

### `backend/.env`
```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=clinic_db
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com
```

### `mobile-app/.env`
```
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3001
```
> Replace `<YOUR_LOCAL_IP>` with your machine's LAN IP (e.g. `192.168.0.98`).
> Find it with: `ifconfig | grep "inet " | grep -v 127.0.0.1`

### `admin-panel/.env`
```
VITE_API_URL=http://localhost:3001
```
