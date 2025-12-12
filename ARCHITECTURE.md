# BoloForms Signature Injection Engine - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                         │  │
│  │                   (Port 3000)                            │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  PDF.js    │  │  Drag & Drop │  │  Field Modals │  │  │
│  │  │  Viewer    │  │   Interface  │  │  (Signature)  │  │  │
│  │  └────────────┘  └──────────────┘  └────────────────┘  │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         Coordinate Transformation Layer           │  │  │
│  │  │  (CSS Pixels ←→ Normalized Percentages)          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST API
                         │ JSON (Base64 PDFs)
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      Backend Server                             │
│                   (Node.js + Express)                           │
│                      (Port 5000)                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                          │  │
│  │  POST /api/upload-pdf    - Upload & hash PDF            │  │
│  │  POST /api/sign-pdf      - Inject fields & sign         │  │
│  │  GET  /api/document/:id  - Get document info            │  │
│  │  GET  /api/audit-trail   - Get security audit           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Coordinate Transformation                   │  │
│  │  • Browser pixels → PDF points                          │  │
│  │  • Top-left → Bottom-left conversion                    │  │
│  │  • Scale factor calculation                             │  │
│  │  • Y-axis flipping                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 PDF Processor (pdf-lib)                  │  │
│  │  • Signature injection                                   │  │
│  │  • Text rendering                                        │  │
│  │  • Image embedding                                       │  │
│  │  • Aspect ratio preservation                             │  │
│  │  • Multi-field support                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Security Layer (crypto)                     │  │
│  │  • SHA-256 hash calculation                             │  │
│  │  • Original PDF hashing                                 │  │
│  │  • Signed PDF hashing                                   │  │
│  │  • File integrity verification                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  File Storage                            │  │
│  │  pdfs/    - Original uploaded PDFs                      │  │
│  │  signed/  - Signed/processed PDFs                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Mongoose ODM
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      MongoDB Database                           │
│                      (Port 27017)                               │
│                                                                 │
│  Collection: documents                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   _id: ObjectId,                                         │  │
│  │   originalPdfHash: "a3f5c8e9..." (SHA-256),             │  │
│  │   signedPdfHash: "b8c2d1f7..." (SHA-256),               │  │
│  │   originalPdfPath: "/path/to/original.pdf",             │  │
│  │   signedPdfPath: "/path/to/signed.pdf",                 │  │
│  │   fields: [                                              │  │
│  │     {                                                    │  │
│  │       type: "signature",                                 │  │
│  │       coordinates: { x, y, width, height },             │  │
│  │       value: "base64...",                                │  │
│  │       timestamp: Date                                    │  │
│  │     }                                                    │  │
│  │   ],                                                     │  │
│  │   status: "signed",                                      │  │
│  │   createdAt: Date,                                       │  │
│  │   signedAt: Date                                         │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Signature Placement

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Interaction (Browser)                             │
└─────────────────────────────────────────────────────────────────┘
User drags signature field to position (400, 300) on 800×1132 canvas
Field size: 200×60 pixels
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Normalization (Frontend)                               │
└─────────────────────────────────────────────────────────────────┘
Convert to percentages:
  xPercent = 400 / 800 = 0.5 (50% from left)
  yPercent = 300 / 1132 = 0.265 (26.5% from top)
  widthPercent = 200 / 800 = 0.25 (25% of width)
  heightPercent = 60 / 1132 = 0.053 (5.3% of height)
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Storage                                                 │
└─────────────────────────────────────────────────────────────────┘
Store in component state:
{
  id: 1234567890,
  type: "signature",
  coordinates: { x: 400, y: 300, width: 200, height: 60 },
  normalizedCoords: { xPercent: 0.5, yPercent: 0.265, ... }
}
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: User Signs (Draws Signature)                           │
└─────────────────────────────────────────────────────────────────┘
Canvas captures drawing → convert to PNG base64
Add to field: imageBase64: "data:image/png;base64,iVBORw0..."
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Submit to Backend (API Call)                           │
└─────────────────────────────────────────────────────────────────┘
POST /api/sign-pdf
{
  documentId: "507f1f77bcf86cd799439011",
  viewportDimensions: { width: 800, height: 1132 },
  fields: [{
    type: "signature",
    coordinates: { x: 400, y: 300, width: 200, height: 60 },
    imageBase64: "data:image/png;base64,..."
  }]
}
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Backend Processing                                     │
└─────────────────────────────────────────────────────────────────┘
A. Load original PDF from disk
B. Get PDF page dimensions (A4: 595.28 × 841.89 points)
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Coordinate Transformation                              │
└─────────────────────────────────────────────────────────────────┘
Calculate scale factors:
  scaleX = 595.28 / 800 = 0.744
  scaleY = 841.89 / 1132 = 0.744

Convert to PDF points:
  pdfX = 400 × 0.744 = 297.6 points
  pdfWidth = 200 × 0.744 = 148.8 points
  pdfHeight = 60 × 0.744 = 44.64 points

Flip Y-axis (bottom-left origin):
  tempY = 300 × 0.744 = 223.2 points (from top)
  pdfY = 841.89 - 223.2 - 44.64 = 574.05 points (from bottom)
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Image Processing                                       │
└─────────────────────────────────────────────────────────────────┘
Decode base64 → image buffer
Embed in PDF (PNG/JPEG)
Calculate aspect ratio:
  If image wider than box: fit to width, center vertically
  If image taller than box: fit to height, center horizontally
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: PDF Injection                                          │
└─────────────────────────────────────────────────────────────────┘
page.drawImage(signatureImage, {
  x: 297.6,
  y: 574.05,
  width: 148.8 (or adjusted for aspect ratio),
  height: 44.64 (or adjusted for aspect ratio)
})
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Security Hashing                                      │
└─────────────────────────────────────────────────────────────────┘
Calculate SHA-256 of signed PDF buffer:
  signedHash = "b8c2d1f7..." (64 hex chars)
Compare with originalHash (should be different)
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 11: Save & Store                                          │
└─────────────────────────────────────────────────────────────────┘
Write signed PDF to disk: signed/signed_1234567890.pdf
Update MongoDB:
  - signedPdfHash
  - signedPdfPath
  - fields array
  - signedAt timestamp
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 12: Response to Frontend                                  │
└─────────────────────────────────────────────────────────────────┘
{
  success: true,
  signedPdfUrl: "/signed/signed_1234567890.pdf",
  originalHash: "a3f5c8e9...",
  signedHash: "b8c2d1f7...",
  auditTrail: { ... }
}
                         ↓

┌─────────────────────────────────────────────────────────────────┐
│ STEP 13: User Receives Signed PDF                              │
└─────────────────────────────────────────────────────────────────┘
• New tab opens with signed PDF
• Audit trail displays on screen
• Signature appears at EXACT location ✅
```

---

## Responsive Coordinate Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Desktop View (1920×1080)                                     │
│                                                              │
│  User places signature at paragraph 3                       │
│  Absolute coords: (960, 500)                                │
│  Normalized: (0.5, 0.463)                                   │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ Viewport Changes (Resize / Mobile Device Toggle)            │
│                                                              │
│  New viewport: 375×667 (iPhone)                             │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ Denormalization                                              │
│                                                              │
│  newX = 0.5 × 375 = 187.5                                   │
│  newY = 0.463 × 667 = 308.7                                 │
│                                                              │
│  Result: Signature still at paragraph 3! ✅                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Audit Trail Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Original PDF Uploaded                                        │
└─────────────────────────────────────────────────────────────────┘
                         ↓
              Calculate SHA-256 Hash
                         ↓
              originalHash = "a3f5c8e9..."
                         ↓
              Store in MongoDB
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. User Signs Document (Adds Fields)                           │
└─────────────────────────────────────────────────────────────────┘
                         ↓
         Process PDF with Fields Injected
                         ↓
              Calculate SHA-256 Hash
                         ↓
              signedHash = "b8c2d1f7..."
                         ↓
              Store in MongoDB
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Verification                                                 │
│                                                                 │
│  Compare: originalHash ≠ signedHash ✅ (Document modified)     │
│  Verify: Stored hash = File hash ✅ (No tampering)             │
│  Record: Timestamp, fields, user data                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                     Frontend                           │
├────────────────────────────────────────────────────────┤
│  React 18           - UI Framework                     │
│  PDF.js 3.11        - PDF Rendering                    │
│  react-pdf          - React wrapper for PDF.js         │
│  react-rnd          - Resizable/Draggable components   │
│  axios              - HTTP client                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     Backend                            │
├────────────────────────────────────────────────────────┤
│  Node.js            - Runtime                          │
│  Express 4          - Web framework                    │
│  pdf-lib            - PDF manipulation                 │
│  Mongoose 8         - MongoDB ODM                      │
│  crypto (built-in)  - SHA-256 hashing                  │
│  cors               - Cross-origin requests            │
│  dotenv             - Environment variables            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    Database                            │
├────────────────────────────────────────────────────────┤
│  MongoDB 6+         - Document database                │
│  Collection: documents                                 │
│  Indexes: _id (auto), createdAt                        │
└────────────────────────────────────────────────────────┘
```

---

## File Structure Map

```
Folder/
│
├── README.md                   # Main documentation
├── QUICKSTART.md              # 5-minute setup guide
├── TECHNICAL.md               # Deep dive technical docs
├── SCRIPTS.md                 # Commands and debugging
├── PROJECT_SUMMARY.md         # Complete overview
├── VERIFICATION.md            # Setup checklist
├── ARCHITECTURE.md            # This file
├── .gitignore                 # Git ignore rules
│
├── backend/
│   ├── server.js              # Express server entry point
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment config
│   ├── .env.example           # Environment template
│   ├── create-sample-pdf.js   # Sample PDF generator
│   │
│   ├── models/
│   │   └── Document.js        # MongoDB schema
│   │
│   ├── services/
│   │   └── pdfProcessor.js    # PDF manipulation
│   │
│   ├── utils/
│   │   ├── coordinateUtils.js # Coordinate transformation
│   │   └── hashUtils.js       # SHA-256 hashing
│   │
│   ├── routes/
│   │   └── index.js           # Route definitions
│   │
│   ├── pdfs/                  # Original PDFs storage
│   │   └── sample-contract.pdf
│   │
│   └── signed/                # Signed PDFs storage
│
└── frontend/
    ├── package.json           # Frontend dependencies
    │
    ├── public/
    │   └── index.html         # HTML template
    │
    └── src/
        ├── index.js           # React entry point
        ├── App.js             # Main component
        ├── index.css          # Global styles
        │
        ├── components/
        │   ├── SignatureModal.js   # Signature drawing
        │   ├── TextInputModal.js   # Text input
        │   ├── DateInputModal.js   # Date picker
        │   └── ImageInputModal.js  # Image upload
        │
        ├── services/
        │   └── api.js         # API client
        │
        └── utils/
            └── coordinateUtils.js  # Frontend coordinate utils
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                              │
│                    (AWS ALB / Nginx)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌─────────────────┐             ┌─────────────────┐
│  Frontend CDN   │             │  Backend API    │
│  (Vercel/       │             │  (AWS EC2/      │
│   Netlify)      │             │   Heroku)       │
│                 │             │                 │
│  React Build    │             │  Express Server │
│  Static Assets  │             │  Port 5000      │
└─────────────────┘             └────────┬────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ↓                               ↓
                ┌─────────────────┐           ┌─────────────────┐
                │  File Storage   │           │    Database     │
                │  (AWS S3/       │           │  (MongoDB Atlas)│
                │   Azure Blob)   │           │                 │
                │                 │           │  Cluster        │
                │  Original PDFs  │           │  Replica Set    │
                │  Signed PDFs    │           │  Auto-backup    │
                └─────────────────┘           └─────────────────┘
```

---

**This architecture ensures:**
- ✅ Scalability (load balancer)
- ✅ Reliability (replica sets)
- ✅ Security (HTTPS, hashing)
- ✅ Performance (CDN, caching)
- ✅ Maintainability (clean separation)

---

*Architecture designed for reliability and precision in signature placement.*
