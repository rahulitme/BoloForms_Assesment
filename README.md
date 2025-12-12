# BoloForms Signature Injection Engine

A production-ready prototype that bridges the gap between browser coordinates and PDF coordinates, enabling reliable signature and field placement on legal documents.

## 🎯 Problem Solved

**The Challenge:** Web browsers use CSS pixels (top-left origin) while PDFs use points at 72 DPI (bottom-left origin). Screen sizes vary, but PDFs are static.

**Our Solution:** Advanced coordinate transformation system that ensures fields placed on desktop remain perfectly aligned on mobile, and are accurately injected into the final PDF.

## ✨ Features

### Frontend (React.js + PDF.js)
- 📄 **PDF Viewer**: Render any PDF with full zoom control
- 🖱️ **Drag & Drop**: Drag fields (Signature, Text, Image, Date, Radio) onto PDF
- ↔️ **Resize**: Adjust field dimensions dynamically
- 📱 **Responsive**: Fields maintain position across desktop/mobile views
- ✍️ **Interactive**: Sign documents directly in the viewer

### Backend (Node.js + Express + pdf-lib)
- 🔄 **Coordinate Transformation**: CSS pixels → PDF points with bottom-left conversion
- 🖼️ **Aspect Ratio Preservation**: Images fit within boxes without distortion
- 📝 **Multi-Field Support**: Signature, text, image, date, radio button injection
- 🔐 **Security Layer**: SHA-256 hashing for audit trail
- 💾 **MongoDB**: Store document metadata and hashes

### Security & Audit Trail
- Calculate SHA-256 hash of original PDF
- Calculate hash of signed PDF
- Store both hashes in MongoDB
- Verify file integrity at any time
- Complete document history tracking

## 🏗️ Architecture

```
Frontend (Browser)                    Backend (Server)
├── React PDF Viewer                  ├── Express API
├── Drag & Drop Fields                ├── pdf-lib (PDF manipulation)
├── CSS Pixel Coordinates             ├── Coordinate Transformation
└── Responsive Positioning            ├── SHA-256 Hashing
                                      └── MongoDB (Audit Trail)

          ↓ coordinates + fields ↓
          
    Coordinate Transformation Layer
    - CSS pixels (top-left) → PDF points (bottom-left)
    - Viewport scaling calculation
    - Aspect ratio preservation
          
          ↓ final PDF ↓
          
    Signed PDF with perfect field placement
```

## 📋 Prerequisites

- **Node.js** 14+ and npm
- **MongoDB** running locally or connection string
- Modern web browser (Chrome/Firefox/Edge)

## 🚀 Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/boloforms-signatures
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running:
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 4. Start Backend Server

```bash
cd backend
npm start
```

Server will run on `http://localhost:5000`

### 5. Start Frontend

```bash
cd frontend
npm start
```

App will open at `http://localhost:3000`

## 📖 How to Use

### Step 1: Upload PDF
1. Click **"Upload PDF"** button
2. Select any A4 PDF document
3. PDF will be displayed with audit trail hash

### Step 2: Add Fields
1. **Drag** fields from the left sidebar onto the PDF:
   - ✍️ **Signature**: Draw your signature
   - 📝 **Text Box**: Enter text
   - 🖼️ **Image Box**: Upload an image
   - 📅 **Date**: Select a date
   - ⭕ **Radio Button**: Add selection options

2. **Position** fields by dragging them
3. **Resize** fields by dragging corners
4. **Delete** fields using the × button

### Step 3: Fill Fields
- Click any field to open its input modal
- For signatures: Draw using your mouse/touchpad
- For text: Type your content
- For images: Upload from your device
- For dates: Select from calendar

### Step 4: Sign Document
1. Click **"Sign PDF"** button
2. Backend processes all fields
3. Signed PDF opens in new tab
4. Audit trail displays both hashes

## 🔬 Testing Responsiveness

The key feature: **Fields maintain position across screen sizes**

### Test Steps:
1. Place a signature field on a specific paragraph (Desktop view)
2. Open Chrome DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M)
4. Switch to "iPhone 12 Pro" or "iPad"
5. **Result**: Field stays anchored to the same paragraph!

This works because:
- Coordinates are stored as percentages
- Recalculated on viewport resize
- Transformed correctly to PDF points

## 🔐 Security Features

### Audit Trail
Every document has:
- **Original Hash**: SHA-256 of uploaded PDF
- **Signed Hash**: SHA-256 of final PDF
- **Timestamp**: When document was created/signed
- **Field History**: What fields were applied

### View Audit Trail
After signing, check the audit trail section showing:
- Document ID
- Original PDF hash (64-char hex)
- Signed PDF hash
- File integrity verification
- Signing timestamp

## 📐 Coordinate Transformation

### The Math Behind It

**Browser to PDF:**
```javascript
scaleX = PDF_WIDTH / VIEWPORT_WIDTH
scaleY = PDF_HEIGHT / VIEWPORT_HEIGHT

pdfX = browserX * scaleX
pdfY = PDF_HEIGHT - (browserY * scaleY) - height
```

**Key Insight:** Y-axis flips from top-left to bottom-left origin!

### Aspect Ratio Preservation

When a user draws a square box but uploads a wide signature:
```javascript
if (imageAspectRatio > boxAspectRatio) {
  // Fit to width
  drawWidth = boxWidth
  drawHeight = boxWidth / imageAspectRatio
} else {
  // Fit to height
  drawHeight = boxHeight
  drawWidth = boxHeight * imageAspectRatio
}
// Center in box
offsetX = (boxWidth - drawWidth) / 2
offsetY = (boxHeight - drawHeight) / 2
```

Result: Image never stretches or distorts!

## 🌐 API Endpoints

### POST `/api/upload-pdf`
Upload a PDF and get its hash
```json
{
  "pdfBase64": "data:application/pdf;base64,...",
  "fileName": "contract.pdf"
}
```

### POST `/api/sign-pdf`
Inject fields into PDF
```json
{
  "documentId": "507f1f77bcf86cd799439011",
  "fields": [
    {
      "type": "signature",
      "coordinates": { "x": 100, "y": 200, "width": 200, "height": 60 },
      "imageBase64": "data:image/png;base64,..."
    }
  ],
  "viewportDimensions": { "width": 800, "height": 1132 }
}
```

### GET `/api/audit-trail/:id`
Get complete audit trail
```json
{
  "documentId": "...",
  "auditTrail": {
    "originalPdfHash": "a3f5...",
    "signedPdfHash": "b8c2...",
    "originalFileIntact": true,
    "signedFileIntact": true
  }
}
```

## 📁 Project Structure

```
├── backend/
│   ├── models/
│   │   └── Document.js          # MongoDB schema
│   ├── services/
│   │   └── pdfProcessor.js      # PDF manipulation logic
│   ├── utils/
│   │   ├── coordinateUtils.js   # Coordinate transformation
│   │   └── hashUtils.js         # SHA-256 hashing
│   ├── pdfs/                    # Original PDFs
│   ├── signed/                  # Signed PDFs
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignatureModal.js
│   │   │   ├── TextInputModal.js
│   │   │   ├── DateInputModal.js
│   │   │   └── ImageInputModal.js
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── utils/
│   │   │   └── coordinateUtils.js
│   │   ├── App.js               # Main component
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
│
└── README.md
```

## 🔧 Technical Highlights

### 1. Coordinate System Conversion
- **Problem**: Browser Y increases downward, PDF Y increases upward
- **Solution**: `pdfY = PDF_HEIGHT - browserY - height`

### 2. Responsive Positioning
- **Problem**: Fields must stay anchored across screen sizes
- **Solution**: Store as percentages, recalculate on resize

### 3. Aspect Ratio Preservation
- **Problem**: User uploads wide signature into square box
- **Solution**: Calculate fit-to-width or fit-to-height, center remainder

### 4. Multi-Page Support
- **Problem**: Different pages, different coordinates
- **Solution**: Store pageNumber with each field

## 🎨 Customization

### Add New Field Types
1. Add to `FIELD_TYPES` in `App.js`
2. Create modal component
3. Add injection logic in `pdfProcessor.js`
4. Update schema in `Document.js`

### Change PDF Size
Default is A4 (595.28 × 841.89 points).

For Letter size (8.5" × 11"):
```javascript
const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
```

## 🐛 Troubleshooting

### PDF Won't Load
- Check file is valid PDF
- Check CORS settings
- Verify pdf.js worker URL

### Fields Not Appearing
- Ensure PDF is loaded first
- Check console for errors
- Verify container dimensions

### Coordinates Off
- Check viewport dimensions passed to backend
- Verify scale factors
- Test with different zoom levels

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify port 27017 is not blocked

## 📊 Performance

- **PDF Loading**: Optimized with pdf.js worker
- **Field Rendering**: React Rnd for smooth dragging
- **API Calls**: Minimal - only on upload and sign
- **File Storage**: Efficient buffer handling

## 🔒 Production Considerations

Before deploying:
1. ✅ Add authentication/authorization
2. ✅ Implement file size limits
3. ✅ Add rate limiting
4. ✅ Use cloud storage (AWS S3, Azure Blob)
5. ✅ Add HTTPS/SSL
6. ✅ Implement proper error logging
7. ✅ Add input validation
8. ✅ Set up backup strategy

## 📝 License

This is a prototype for BoloForms. All rights reserved.

## 👥 Support

For questions or issues:
- Check the troubleshooting section
- Review the coordinate transformation logic
- Verify MongoDB connection
- Check browser console for errors

---

**Built with ❤️ for reliable document signing**

*"When a user places a signature field on a legal contract, it must appear in that exact location on the final PDF."* - Mission accomplished! ✅
