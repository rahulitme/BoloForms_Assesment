# BoloForms Signature Injection Engine
# Technical Implementation Document

## Problem Statement

When users place signature fields on PDFs in a web browser, the system must:
1. Handle coordinate system differences (browser vs PDF)
2. Maintain field positions across different screen sizes
3. Accurately inject fields into the final PDF without distortion

## Solution Architecture

### Three-Layer Coordinate System

#### Layer 1: Browser Coordinates (CSS Pixels)
- Origin: Top-left corner
- Unit: CSS pixels (varies with screen DPI)
- Scales with viewport size

#### Layer 2: Normalized Coordinates (Percentages)
- Origin: Percentage-based (0-1 range)
- Unit: Relative to container dimensions
- **Purpose**: Enables responsiveness across screen sizes

#### Layer 3: PDF Coordinates (Points)
- Origin: Bottom-left corner
- Unit: Points (1 point = 1/72 inch)
- Fixed size regardless of screen

### Coordinate Transformation Pipeline

```
User drags field at (400px, 300px) on 800×1132px viewport
        ↓
Step 1: Normalize to percentages
        xPercent = 400 / 800 = 0.5 (50%)
        yPercent = 300 / 1132 = 0.265 (26.5%)
        ↓
Step 2: Store in database
        { xPercent: 0.5, yPercent: 0.265 }
        ↓
Step 3: When viewport changes (e.g., mobile 375×667px)
        newX = 0.5 × 375 = 187.5px
        newY = 0.265 × 667 = 176.755px
        ↓
Step 4: User signs → send to backend with current viewport
        { x: 187.5, y: 176.755, viewport: { width: 375, height: 667 } }
        ↓
Step 5: Backend converts to PDF points (A4: 595.28×841.89)
        scaleX = 595.28 / 375 = 1.587
        scaleY = 841.89 / 667 = 1.262
        pdfX = 187.5 × 1.587 = 297.56 points
        ↓
Step 6: Flip Y-axis (bottom-left origin)
        browserY = 176.755 px
        heightInPoints = height × scaleY
        pdfY = 841.89 - (176.755 × 1.262) - heightInPoints
        ↓
Step 7: Inject into PDF at exact coordinates
```

## Key Algorithms

### 1. Browser to PDF Coordinate Conversion

```javascript
function browserToPdfCoordinates(browserCoords, viewportDimensions, pdfPageDimensions) {
  // Calculate scale factors
  const scaleX = pdfPageDimensions.width / viewportDimensions.width;
  const scaleY = pdfPageDimensions.height / viewportDimensions.height;

  // Convert position
  const xInPoints = browserCoords.x * scaleX;
  const heightInPoints = browserCoords.height * scaleY;
  
  // Convert Y from top-left to bottom-left
  const yFromTop = browserCoords.y * scaleY;
  const yFromBottom = pdfPageDimensions.height - yFromTop - heightInPoints;

  return {
    x: xInPoints,
    y: yFromBottom,
    width: browserCoords.width * scaleX,
    height: heightInPoints
  };
}
```

**Why this works:**
- `scaleX` and `scaleY` account for different viewport sizes
- Y-axis flip formula: `pdfY = totalHeight - browserY - elementHeight`
- Result: Field appears at identical visual position in PDF

### 2. Aspect Ratio Preservation

```javascript
function preserveAspectRatio(image, box) {
  const imageAspectRatio = image.width / image.height;
  const boxAspectRatio = box.width / box.height;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (imageAspectRatio > boxAspectRatio) {
    // Image is wider - fit to width
    drawWidth = box.width;
    drawHeight = box.width / imageAspectRatio;
    offsetX = 0;
    offsetY = (box.height - drawHeight) / 2;
  } else {
    // Image is taller - fit to height
    drawHeight = box.height;
    drawWidth = box.height * imageAspectRatio;
    offsetX = (box.width - drawWidth) / 2;
    offsetY = 0;
  }
  
  return { drawWidth, drawHeight, offsetX, offsetY };
}
```

**Why this works:**
- Determines limiting dimension (width or height)
- Scales to fit while maintaining aspect ratio
- Centers remainder space for visual balance
- Prevents stretching/distortion

### 3. Responsive Field Positioning

```javascript
// Store field with normalized coordinates
const field = {
  id: uniqueId,
  type: 'signature',
  coordinates: { x: 400, y: 300, width: 200, height: 60 },
  normalizedCoords: {
    xPercent: 400 / viewportWidth,
    yPercent: 300 / viewportHeight,
    widthPercent: 200 / viewportWidth,
    heightPercent: 60 / viewportHeight
  }
};

// On viewport resize
window.addEventListener('resize', () => {
  const newViewport = getViewportDimensions();
  
  fields.forEach(field => {
    field.coordinates = {
      x: field.normalizedCoords.xPercent * newViewport.width,
      y: field.normalizedCoords.yPercent * newViewport.height,
      width: field.normalizedCoords.widthPercent * newViewport.width,
      height: field.normalizedCoords.heightPercent * newViewport.height
    };
  });
  
  reRenderFields();
});
```

**Why this works:**
- Percentages are resolution-independent
- Recalculation maintains relative position
- Works across any screen size (desktop, tablet, mobile)

## Security Implementation

### SHA-256 Hashing

```javascript
// Before signing
const crypto = require('crypto');
const originalHash = crypto
  .createHash('sha256')
  .update(pdfBuffer)
  .digest('hex');

// After signing
const signedHash = crypto
  .createHash('sha256')
  .update(signedPdfBuffer)
  .digest('hex');

// Store both in database
await Document.create({
  originalPdfHash: originalHash,
  signedPdfHash: signedHash,
  timestamp: new Date()
});
```

**Security guarantees:**
- Any modification changes the hash
- 256-bit hash space (2^256 possibilities)
- Collision probability: virtually zero
- Can verify document integrity at any time

### Audit Trail Schema

```javascript
{
  documentId: ObjectId,
  originalPdfHash: String (64 hex chars),
  signedPdfHash: String (64 hex chars),
  originalPdfPath: String,
  signedPdfPath: String,
  fields: [{
    type: String,
    coordinates: Object,
    value: String,
    timestamp: Date
  }],
  status: String,
  createdAt: Date,
  signedAt: Date
}
```

## Performance Optimizations

### 1. PDF Rendering
- Uses pdf.js web worker (offloads processing)
- Lazy loading of pages (only render visible page)
- Canvas-based rendering (hardware accelerated)

### 2. Coordinate Calculations
- Cached viewport dimensions (avoid repeated DOM queries)
- Batch updates on resize (debounced)
- Pre-calculated scale factors

### 3. File Handling
- Streaming file reads (memory efficient)
- Buffer-based processing (no disk I/O during transformation)
- Async/await throughout (non-blocking)

## Edge Cases Handled

### 1. Multi-Page PDFs
- Store page number with each field
- Only render fields for current page
- Transform coordinates per-page

### 2. Rotated PDFs
- Detect page rotation
- Adjust coordinate transformation
- Maintain visual consistency

### 3. High-DPI Screens
- CSS pixels vs device pixels
- Scale factor calculation accounts for this
- Result: consistent across all displays

### 4. Very Small or Large Fields
- Minimum size constraints (prevents invisible fields)
- Maximum size constraints (prevents overflow)
- Validation before submission

## Testing Strategy

### Unit Tests
- Coordinate transformation accuracy
- Aspect ratio calculations
- Hash generation consistency

### Integration Tests
- Upload → Sign → Verify workflow
- Multi-field documents
- Different PDF sizes

### Responsive Tests
- Desktop → Mobile transformation
- Tablet → Desktop transformation
- Field alignment verification

### Security Tests
- Hash collision attempts
- File integrity verification
- Unauthorized access prevention

## Real-World Example

### Scenario: Legal Contract Signing

**Initial Setup:**
- PDF: A4 size (595.28 × 841.89 points)
- Desktop viewport: 1200 × 1600 pixels
- User places signature at visual position "below paragraph 3"

**Desktop (1200×1600px):**
```
User drags signature to (300, 800)
Store: { xPercent: 0.25, yPercent: 0.5 }
Display: at (300, 800) pixels
```

**Mobile (375×667px):**
```
Retrieve: { xPercent: 0.25, yPercent: 0.5 }
Calculate: x = 0.25 × 375 = 93.75
          y = 0.5 × 667 = 333.5
Display: at (93.75, 333.5) pixels
Result: Still below paragraph 3! ✅
```

**PDF Generation:**
```
Viewport: 375 × 667 (current mobile view)
Browser coords: (93.75, 333.5)

scaleX = 595.28 / 375 = 1.587
scaleY = 841.89 / 667 = 1.262

pdfX = 93.75 × 1.587 = 148.78 points
tempY = 333.5 × 1.262 = 420.88 points
pdfY = 841.89 - 420.88 - (height × 1.262)

Result: Signature appears at exact visual position! ✅
```

## Conclusion

This implementation solves the core challenge of bridging browser and PDF coordinate systems through:

1. **Three-layer architecture**: Browser → Normalized → PDF
2. **Responsive design**: Percentage-based storage
3. **Accurate transformation**: Scale factors + Y-axis flip
4. **Aspect ratio preservation**: Smart scaling algorithm
5. **Security**: SHA-256 hashing + audit trail

The result: **Reliable, pixel-perfect signature placement regardless of device or screen size.**

---

*Implementation Date: December 2025*
*Technology Stack: React, Node.js, pdf-lib, MongoDB*
*Core Promise: Reliability in signature placement*
