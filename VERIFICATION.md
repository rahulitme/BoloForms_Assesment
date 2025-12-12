# Setup Verification Checklist

Run through this checklist to ensure everything is set up correctly.

## ✅ Pre-Flight Checks

### 1. Node.js Installation
```bash
node --version
```
**Expected:** v14.0.0 or higher
**Status:** [ ]

### 2. npm Installation
```bash
npm --version
```
**Expected:** v6.0.0 or higher
**Status:** [ ]

### 3. MongoDB Installation
```bash
mongo --version
```
OR
```bash
mongod --version
```
**Expected:** MongoDB shell version or server version
**Status:** [ ]

---

## ✅ Backend Setup

### 1. Dependencies Installed
```bash
cd backend
npm install
```
**Check for errors:** [ ]
**node_modules created:** [ ]

### 2. Environment File
```bash
# Verify .env file exists
dir .env          # Windows
ls -la .env       # Linux/Mac
```
**File exists:** [ ]
**Contains MONGODB_URI:** [ ]
**Contains PORT:** [ ]

### 3. MongoDB Running
```bash
# Start MongoDB
mongod

# In another terminal, check connection
mongo
show dbs
exit
```
**MongoDB starts:** [ ]
**Can connect:** [ ]

### 4. Sample PDF Created
```bash
cd backend
node create-sample-pdf.js
```
**Expected output:** "✅ Sample PDF created successfully!"
**File exists:** backend/pdfs/sample-contract.pdf [ ]

### 5. Backend Server Starts
```bash
cd backend
npm start
```
**Expected output:**
```
✅ MongoDB connected
🚀 Server running on port 5000
📁 PDF storage ready
🔐 Security layer active (SHA-256 hashing)
```
**All checks pass:** [ ]
**No errors:** [ ]

### 6. API Health Check
Open browser or use curl:
```bash
curl http://localhost:5000/api/health
```
OR visit: http://localhost:5000/api/health

**Expected JSON:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "mongodb": "connected"
}
```
**Health check passes:** [ ]

---

## ✅ Frontend Setup

### 1. Dependencies Installed
```bash
cd frontend
npm install
```
**Check for errors:** [ ]
**node_modules created:** [ ]

### 2. Frontend Server Starts
```bash
cd frontend
npm start
```
**Expected:** Browser opens to http://localhost:3000
**No compilation errors:** [ ]
**Page loads:** [ ]

### 3. UI Elements Visible
Check that you can see:
- [ ] "BoloForms" header in sidebar
- [ ] Field palette with 5 draggable fields
- [ ] "Upload PDF" button in toolbar
- [ ] Main canvas area

**All elements visible:** [ ]

---

## ✅ Integration Tests

### 1. Upload PDF
- [ ] Click "Upload PDF"
- [ ] Select backend/pdfs/sample-contract.pdf
- [ ] PDF displays in viewer
- [ ] Success message appears
- [ ] Page count shows "Page 1 of 1"

### 2. Drag & Drop Field
- [ ] Drag "Signature" field onto PDF
- [ ] Field appears on canvas
- [ ] Field has blue border
- [ ] Modal opens for signature

### 3. Draw Signature
- [ ] Canvas appears in modal
- [ ] Can draw with mouse
- [ ] "Clear" button works
- [ ] "Save Signature" stores signature
- [ ] Modal closes
- [ ] Field shows "✅ Signed"

### 4. Add Text Field
- [ ] Drag "Text Box" onto PDF
- [ ] Modal opens
- [ ] Type text in textarea
- [ ] Click "Add Text"
- [ ] Field displays text

### 5. Resize Field
- [ ] Click and drag corner of field
- [ ] Field resizes smoothly
- [ ] Maintains aspect ratio (optional)

### 6. Delete Field
- [ ] Hover over field
- [ ] X button appears
- [ ] Click X
- [ ] Field disappears

### 7. Sign PDF
- [ ] Add at least one signature field with data
- [ ] Click "Sign PDF" button
- [ ] Loading indicator appears
- [ ] Success message: "PDF signed successfully!"
- [ ] New tab opens with signed PDF
- [ ] Audit trail appears below

### 8. Verify Audit Trail
- [ ] Document ID displayed
- [ ] Original PDF Hash (64 hex characters)
- [ ] Signed PDF Hash (different from original)
- [ ] Status shows
- [ ] "Files Intact: ✅ Verified"

---

## ✅ Responsive Test

### 1. Desktop View
- [ ] Place signature field on specific paragraph
- [ ] Note which paragraph it's on

### 2. Mobile View
- [ ] Press F12 (DevTools)
- [ ] Press Ctrl+Shift+M (Device Toolbar)
- [ ] Select "iPhone 12 Pro"
- [ ] Signature field stays on same paragraph ✅

### 3. Tablet View
- [ ] Select "iPad"
- [ ] Field still anchored correctly ✅

---

## ✅ API Tests

### 1. Upload Endpoint
```bash
# This should already work from frontend, but you can test directly:
curl -X POST http://localhost:5000/api/upload-pdf \
  -H "Content-Type: application/json" \
  -d '{"pdfBase64": "data:application/pdf;base64,...", "fileName": "test.pdf"}'
```
**Returns documentId:** [ ]
**Returns originalHash:** [ ]

### 2. Health Endpoint
```bash
curl http://localhost:5000/api/health
```
**Returns status: OK:** [ ]
**Returns mongodb: connected:** [ ]

---

## ✅ Security Tests

### 1. Hash Generation
- [ ] Upload PDF
- [ ] Note original hash
- [ ] Sign PDF
- [ ] Note signed hash
- [ ] **Hashes are different** (document was modified) ✅

### 2. File Integrity
- [ ] Check audit trail
- [ ] "Files Intact" shows ✅ Verified
- [ ] Both hashes match stored files

### 3. MongoDB Storage
```bash
mongo
use boloforms-signatures
db.documents.find().pretty()
```
- [ ] Documents stored
- [ ] originalPdfHash present
- [ ] signedPdfHash present
- [ ] fields array populated
- [ ] timestamps recorded

---

## ✅ Error Handling

### 1. No PDF Uploaded
- [ ] Click "Sign PDF" without uploading
- [ ] Error message: "Please upload a PDF first"

### 2. No Fields Added
- [ ] Upload PDF
- [ ] Click "Sign PDF" without adding fields
- [ ] Error message: "Please add at least one field"

### 3. Incomplete Fields
- [ ] Add signature field but don't fill it
- [ ] Click "Sign PDF"
- [ ] Error message about incomplete fields

### 4. Invalid File Type
- [ ] Try uploading .txt or .jpg
- [ ] Error message about valid PDF

---

## ✅ Performance Tests

### 1. PDF Loading
- [ ] PDF loads within 2 seconds
- [ ] No lag when zooming
- [ ] Smooth dragging

### 2. Field Operations
- [ ] Adding field is instant
- [ ] Resizing is smooth
- [ ] No jank when moving fields

### 3. Signing Process
- [ ] Completes within 5 seconds
- [ ] Progress indicator works
- [ ] No timeout errors

---

## ✅ Cross-Browser Tests (Optional)

### Chrome
- [ ] All features work
- [ ] UI displays correctly

### Firefox
- [ ] All features work
- [ ] UI displays correctly

### Edge
- [ ] All features work
- [ ] UI displays correctly

### Safari (Mac only)
- [ ] All features work
- [ ] UI displays correctly

---

## 🎯 Final Verification

### All Systems Go?
- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] MongoDB connected
- [ ] Can upload PDF
- [ ] Can add fields
- [ ] Can sign PDF
- [ ] Audit trail works
- [ ] Responsive design works
- [ ] Signed PDF is correct

### Ready for Demo?
- [ ] Sample PDF created
- [ ] Understand coordinate transformation
- [ ] Can explain security features
- [ ] Tested on multiple screen sizes
- [ ] Documentation reviewed

---

## 🚨 Troubleshooting

If any check fails, refer to:
1. **QUICKSTART.md** - Setup instructions
2. **SCRIPTS.md** - Common commands
3. **README.md** - Detailed documentation
4. **Browser console** - Frontend errors
5. **Terminal output** - Backend errors

Common issues:
- MongoDB not running → Start with `mongod`
- Port in use → Kill process or change port
- Module not found → Run `npm install`
- CORS error → Check backend FRONTEND_URL

---

## ✅ Success!

If all checks pass:

**🎉 Congratulations! The BoloForms Signature Injection Engine is fully operational!**

You now have:
- ✅ Functional backend API
- ✅ Interactive frontend
- ✅ Working coordinate transformation
- ✅ Security audit trail
- ✅ Responsive design
- ✅ Complete documentation

**Next Steps:**
1. Demo to stakeholders
2. Test with real documents
3. Collect user feedback
4. Plan production deployment
5. Implement authentication (if needed)

---

**Checklist completed on:** _______________
**Completed by:** _______________
**All systems:** ✅ GO / ⚠️ NEEDS ATTENTION
