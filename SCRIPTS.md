# Development Scripts

## Backend Scripts

### Start Server (Development)
```bash
cd backend
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Start Server (Production)
```bash
cd backend
npm start
```

### Create Sample PDF
```bash
cd backend
node create-sample-pdf.js
```
Generates `backend/pdfs/sample-contract.pdf` - a complete employment contract ready for testing.

### Test API Health
```bash
curl http://localhost:5000/api/health
```

### View MongoDB Data
```bash
mongo
use boloforms-signatures
db.documents.find().pretty()
```

## Frontend Scripts

### Start Development Server
```bash
cd frontend
npm start
```
Opens browser at http://localhost:3000

### Build for Production
```bash
cd frontend
npm run build
```
Creates optimized build in `frontend/build/`

### Run Tests
```bash
cd frontend
npm test
```

## Full Stack Commands

### Install Everything
```bash
# From project root
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### Start Everything (Windows)
```powershell
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend; npm start

# Terminal 3: Frontend
cd frontend; npm start
```

### Start Everything (Linux/Mac)
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend && npm start

# Terminal 3: Frontend
cd frontend && npm start
```

## Useful Debugging Commands

### Check MongoDB Connection
```bash
# From backend directory
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/boloforms-signatures').then(() => console.log('Connected!')).catch(err => console.error(err));"
```

### Test PDF Processing
```bash
cd backend
node -e "const { PDFDocument } = require('pdf-lib'); PDFDocument.create().then(() => console.log('pdf-lib working!'));"
```

### View Signed PDFs
Open in browser:
- http://localhost:5000/signed/

### View Original PDFs
Open in browser:
- http://localhost:5000/pdfs/

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/boloforms-signatures
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env - optional)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Port Information

- Frontend: **3000**
- Backend: **5000**
- MongoDB: **27017**

Make sure these ports are available!

## Common Issues & Fixes

### "Address already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### "MongoDB not found"
```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# Linux
sudo systemctl status mongod

# Mac
brew services list
```

### "Module not found"
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

### Clear MongoDB Data
```bash
mongo
use boloforms-signatures
db.documents.deleteMany({})
```

## Testing Checklist

- [ ] MongoDB is running
- [ ] Backend starts without errors
- [ ] Frontend opens in browser
- [ ] Can upload PDF
- [ ] Can drag fields onto PDF
- [ ] Can fill field data
- [ ] Can sign PDF
- [ ] Signed PDF downloads correctly
- [ ] Audit trail displays
- [ ] Fields maintain position on mobile view

## Production Deployment

### Backend
1. Set environment variables
2. Configure MongoDB Atlas or cloud database
3. Set up file storage (AWS S3, Azure Blob)
4. Enable HTTPS
5. Add authentication middleware
6. Set up logging (Winston, Pino)
7. Add rate limiting (express-rate-limit)

### Frontend
1. `npm run build`
2. Deploy to hosting (Vercel, Netlify, AWS S3)
3. Configure environment variables
4. Set up CDN
5. Enable gzip compression

### Database
1. Use MongoDB Atlas or managed service
2. Set up backups
3. Configure indexes for performance
4. Enable authentication
5. Set connection limits

---

**Pro Tip:** Keep all three services (MongoDB, Backend, Frontend) running in separate terminals for best development experience!
