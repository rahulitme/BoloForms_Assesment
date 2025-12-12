/**
 * Coordinate Transformation Utilities
 * Converts between Browser CSS Pixels (top-left origin) and PDF Points (bottom-left origin)
 */

const PDF_DPI = 72; // Standard PDF DPI
const A4_WIDTH_POINTS = 595.28; // A4 width in points (210mm)
const A4_HEIGHT_POINTS = 841.89; // A4 height in points (297mm)

/**
 * Convert CSS pixels to PDF points
 * Takes into account viewport scaling and coordinate system differences
 * 
 * @param {Object} browserCoords - Coordinates from browser
 * @param {number} browserCoords.x - X position (from left)
 * @param {number} browserCoords.y - Y position (from top)
 * @param {number} browserCoords.width - Width in pixels
 * @param {number} browserCoords.height - Height in pixels
 * @param {Object} viewportDimensions - Browser viewport dimensions
 * @param {number} viewportDimensions.width - Viewport width in pixels
 * @param {number} viewportDimensions.height - Viewport height in pixels
 * @param {Object} pdfPageDimensions - Actual PDF page dimensions
 * @param {number} pdfPageDimensions.width - PDF page width in points (default A4)
 * @param {number} pdfPageDimensions.height - PDF page height in points (default A4)
 * @returns {Object} - Coordinates in PDF coordinate system
 */
function browserToPdfCoordinates(
  browserCoords,
  viewportDimensions,
  pdfPageDimensions = { width: A4_WIDTH_POINTS, height: A4_HEIGHT_POINTS }
) {
  // Calculate scale factors
  const scaleX = pdfPageDimensions.width / viewportDimensions.width;
  const scaleY = pdfPageDimensions.height / viewportDimensions.height;

  // Convert position from CSS pixels to PDF points
  const xInPoints = browserCoords.x * scaleX;
  const widthInPoints = browserCoords.width * scaleX;
  const heightInPoints = browserCoords.height * scaleY;

  // Convert Y coordinate from top-left to bottom-left origin
  // Browser: Y increases downward from top
  // PDF: Y increases upward from bottom
  const yFromTop = browserCoords.y * scaleY;
  const yFromBottom = pdfPageDimensions.height - yFromTop - heightInPoints;

  return {
    x: xInPoints,
    y: yFromBottom,
    width: widthInPoints,
    height: heightInPoints
  };
}

/**
 * Convert PDF points to CSS pixels (for displaying in browser)
 * 
 * @param {Object} pdfCoords - Coordinates in PDF system
 * @param {number} pdfCoords.x - X position (from left)
 * @param {number} pdfCoords.y - Y position (from bottom)
 * @param {number} pdfCoords.width - Width in points
 * @param {number} pdfCoords.height - Height in points
 * @param {Object} viewportDimensions - Browser viewport dimensions
 * @param {number} viewportDimensions.width - Viewport width in pixels
 * @param {number} viewportDimensions.height - Viewport height in pixels
 * @param {Object} pdfPageDimensions - Actual PDF page dimensions
 * @param {number} pdfPageDimensions.width - PDF page width in points
 * @param {number} pdfPageDimensions.height - PDF page height in points
 * @returns {Object} - Coordinates in browser coordinate system
 */
function pdfToBrowserCoordinates(
  pdfCoords,
  viewportDimensions,
  pdfPageDimensions = { width: A4_WIDTH_POINTS, height: A4_HEIGHT_POINTS }
) {
  // Calculate scale factors
  const scaleX = viewportDimensions.width / pdfPageDimensions.width;
  const scaleY = viewportDimensions.height / pdfPageDimensions.height;

  // Convert position from PDF points to CSS pixels
  const xInPixels = pdfCoords.x * scaleX;
  const widthInPixels = pdfCoords.width * scaleX;
  const heightInPixels = pdfCoords.height * scaleY;

  // Convert Y coordinate from bottom-left to top-left origin
  const yFromBottom = pdfCoords.y;
  const yFromTop = (pdfPageDimensions.height - yFromBottom - pdfCoords.height) * scaleY;

  return {
    x: xInPixels,
    y: yFromTop,
    width: widthInPixels,
    height: heightInPixels
  };
}

/**
 * Normalize coordinates to be responsive across different viewport sizes
 * Stores as percentage-based values that can be recalculated for any viewport
 * 
 * @param {Object} browserCoords - Coordinates from browser
 * @param {Object} viewportDimensions - Current viewport dimensions
 * @returns {Object} - Normalized coordinates (0-1 range)
 */
function normalizeCoordinates(browserCoords, viewportDimensions) {
  return {
    xPercent: browserCoords.x / viewportDimensions.width,
    yPercent: browserCoords.y / viewportDimensions.height,
    widthPercent: browserCoords.width / viewportDimensions.width,
    heightPercent: browserCoords.height / viewportDimensions.height,
    pageNumber: browserCoords.pageNumber || 0
  };
}

/**
 * Denormalize coordinates from percentage back to pixels
 * 
 * @param {Object} normalizedCoords - Normalized coordinates
 * @param {Object} viewportDimensions - Target viewport dimensions
 * @returns {Object} - Absolute pixel coordinates
 */
function denormalizeCoordinates(normalizedCoords, viewportDimensions) {
  return {
    x: normalizedCoords.xPercent * viewportDimensions.width,
    y: normalizedCoords.yPercent * viewportDimensions.height,
    width: normalizedCoords.widthPercent * viewportDimensions.width,
    height: normalizedCoords.heightPercent * viewportDimensions.height,
    pageNumber: normalizedCoords.pageNumber || 0
  };
}

module.exports = {
  browserToPdfCoordinates,
  pdfToBrowserCoordinates,
  normalizeCoordinates,
  denormalizeCoordinates,
  A4_WIDTH_POINTS,
  A4_HEIGHT_POINTS,
  PDF_DPI
};
