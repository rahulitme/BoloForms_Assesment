# Quick Start Guide

## First Time Setup (5 minutes)

### 1. Install MongoDB (if not already installed)

**Windows:**
Download from https://www.mongodb.com/try/download/community

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
```

### 2. Start MongoDB
```bash
mongod
```
Keep this terminal open.

### 3. Install Dependencies

Open a new terminal:
```bash
cd backend
npm install
```

Open another terminal:
```bash
cd frontend
npm install
```

### 4. Create Sample PDF

```bash
cd backend
node create-sample-pdf.js
```

This creates `backend/pdfs/sample-contract.pdf` - an employment contract ready for signing!

### 5. Start Backend

```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
📁 PDF storage ready
🔐 Security layer active (SHA-256 hashing)
```

### 6. Start Frontend

Open a new terminal:
```bash
cd frontend
npm start
```

Browser will open to `http://localhost:3000`

## Testing the Application

### Scenario 1: Sign Employment Contract

1. **Upload PDF**: Click "Upload PDF" → Select `backend/pdfs/sample-contract.pdf`

2. **Add Employee Name**:
   - Drag "Text Box" field to "EMPLOYEE: [Employee Name]" area
   - Enter name in modal
   - Click "Add Text"

3. **Add Start Date**:
   - Drag "Date" field to the start date line
   - Select date from picker
   - Click "Add Date"

4. **Add Health Insurance Selection**:
   - Drag "Radio Button" to "I accept" checkbox
   - (Radio will show as filled circle)

5. **Add Employee Signature**:
   - Drag "Signature" field to employee signature line
   - Draw your signature in the modal
   - Click "Save Signature"

6. **Sign Document**:
   - Click "Sign PDF" button
   - Signed PDF opens in new tab
   - Audit trail shows both hashes

### Scenario 2: Test Responsiveness

1. Place signature field on desktop view
2. Press F12 (DevTools)
3. Press Ctrl+Shift+M (Device Toolbar)
4. Select "iPhone 12 Pro"
5. **Verify**: Signature field stays on the same paragraph!

### Scenario 3: Verify Security

1. After signing, check "Audit Trail" section
2. Note the original hash and signed hash
3. Both hashes should be different (document was modified)
4. "Files Intact" should show ✅ Verified

## Common Issues

### "MongoDB connection error"
- Make sure MongoDB is running (`mongod`)
- Check port 27017 is not in use

### "Cannot find module"
- Run `npm install` in both backend and frontend

### "PDF won't load"
- Check file is valid PDF
- Try the sample PDF first

### "Fields appear in wrong location"
- This shouldn't happen! But if it does:
  - Check browser console for errors
  - Verify viewport dimensions are being sent to backend
  - Test with zoom at 100%

## Next Steps

- Try different PDFs (legal contracts, forms, etc.)
- Test on mobile devices
- Add multiple signatures
- Experiment with image uploads
- Check the audit trail after each signing

## Development Tips

### Backend (Port 5000)
- API endpoint: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- Signed PDFs: `http://localhost:5000/signed/`

### Frontend (Port 3000)
- Main app: `http://localhost:3000`
- Auto-reloads on code changes

### MongoDB
- Database: `boloforms-signatures`
- Collection: `documents`
- View with MongoDB Compass or:
  ```bash
  mongo
  use boloforms-signatures
  db.documents.find().pretty()
  ```

## Architecture Quick Reference

```
User uploads PDF
    ↓
Frontend: Display in viewer
    ↓
User drags fields onto PDF
    ↓
Frontend: Store as percentages (responsive)
    ↓
User fills in fields (signature, text, etc.)
    ↓
Click "Sign PDF"
    ↓
Backend: Convert percentages → absolute pixels
    ↓
Backend: Convert pixels → PDF points
    ↓
Backend: Flip Y-axis (top-left → bottom-left)
    ↓
Backend: Inject fields into PDF
    ↓
Backend: Calculate SHA-256 hashes
    ↓
Backend: Save to MongoDB
    ↓
Return signed PDF to user
```

## Success Criteria

✅ PDF displays correctly
✅ Fields can be dragged and dropped
✅ Fields can be resized
✅ Modals open for data entry
✅ Fields maintain position on mobile view
✅ Sign PDF generates correct output
✅ Signatures appear in exact location
✅ Aspect ratios are preserved
✅ Audit trail shows both hashes
✅ Signed PDF opens in new tab

If all criteria pass: **You're ready to go!** 🚀

---

Need help? Check the main README.md for detailed documentation.
