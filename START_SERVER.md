# 🚀 How to Start Denla Discount Shop

## Single Command Startup

Now you only need to run **ONE command** to start both backend and frontend!

### Start the Server:

```bash
cd backend
npm run dev
```

**That's it!** The server will:
1. ✅ Start on port 5000
2. ✅ Serve the frontend automatically
3. ✅ Open your browser to http://localhost:5000
4. ✅ Serve all API endpoints on http://localhost:5000/api

---

## What Changed?

### Before (2 servers needed):
- ❌ Backend: `cd backend && npm run dev` (port 5000)
- ❌ Frontend: Separate Live Server (port 5173 or 5500)
- ❌ Had to manage 2 terminals

### Now (1 server only):
- ✅ Backend serves frontend: `cd backend && npm run dev`
- ✅ Everything runs on port 5000
- ✅ One terminal, one command
- ✅ Browser opens automatically

---

## Accessing Your Site

Once the server starts, visit:

| Page | URL |
|------|-----|
| **Homepage** | http://localhost:5000/ |
| **Shop** | http://localhost:5000/shop.html |
| **POS System** | http://localhost:5000/pos.html |
| **Login** | http://localhost:5000/login.html |
| **Dashboard** | http://localhost:5000/dashboard.html |
| **API Docs** | http://localhost:5000/api |
| **Health Check** | http://localhost:5000/health |

---

## Admin Login Credentials

**Email:** `admin@denla.com`  
**Password:** `admin123`

---

## Server Features

### ✅ Auto-Open Browser
- Browser opens automatically when server starts (development mode)
- Opens to http://localhost:5000

### ✅ Auto-Reload
- Uses `nodemon` to automatically restart on file changes
- No need to manually restart server

### ✅ Static File Serving
- Serves all frontend files from `/public` folder
- Images: `/img/...`
- CSS: `/css/...`
- JavaScript: `/js/...`
- Libraries: `/lib/...`

### ✅ API Endpoints
- All API routes work: `/api/products`, `/api/auth`, etc.
- CORS configured for same-origin requests

---

## Troubleshooting

### Port Already in Use?
```bash
# Kill processes on port 5000
Get-Process -Name node | Stop-Process -Force
```

### Server Won't Start?
```bash
# Reinstall dependencies
cd backend
npm install
```

### Browser Doesn't Open Automatically?
Just manually open: http://localhost:5000

---

## File Structure

```
d:\Drew Files\Awesome\
├── backend/
│   ├── server.js          ← Serves frontend + API
│   ├── package.json
│   └── ...
└── public/                ← Frontend files (served by backend)
    ├── index.html         ← Homepage
    ├── pos.html           ← POS system
    ├── login.html         ← Login page
    ├── dashboard.html     ← Admin dashboard
    ├── css/               ← Stylesheets
    ├── js/                ← JavaScript
    ├── img/               ← Images
    └── lib/               ← Libraries
```

---

## Development Workflow

1. **Start Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Make Changes:**
   - Edit files in `/public` folder (HTML, CSS, JS)
   - Edit backend files in `/backend` folder
   - Server auto-reloads on changes

3. **Test Changes:**
   - Refresh browser (Ctrl+R or F5)
   - Check console for errors

4. **Stop Server:**
   - Press `Ctrl+C` in terminal
   - Or close terminal window

---

## 🎉 That's It!

You now have a unified development experience with:
- ✅ Single command startup
- ✅ Auto browser opening
- ✅ Auto server reload
- ✅ All pages served from one port
- ✅ Simplified workflow

**Enjoy building! 🚀**
