/**
 * Coordinate transformation utilities for frontend
 * Handles responsive positioning of fields across different viewport sizes
 */

/**
 * Normalize coordinates to percentage-based values
 * This ensures fields maintain their relative position across different screen sizes
 */
export const normalizeCoordinates = (absoluteCoords, containerDimensions) => {
  return {
    xPercent: absoluteCoords.x / containerDimensions.width,
    yPercent: absoluteCoords.y / containerDimensions.height,
    widthPercent: absoluteCoords.width / containerDimensions.width,
    heightPercent: absoluteCoords.height / containerDimensions.height,
    pageNumber: absoluteCoords.pageNumber || 0
  };
};

/**
 * Denormalize coordinates from percentage back to absolute pixels
 * Used when viewport size changes to maintain field positions
 */
export const denormalizeCoordinates = (normalizedCoords, containerDimensions) => {
  return {
    x: normalizedCoords.xPercent * containerDimensions.width,
    y: normalizedCoords.yPercent * containerDimensions.height,
    width: normalizedCoords.widthPercent * containerDimensions.width,
    height: normalizedCoords.heightPercent * containerDimensions.height,
    pageNumber: normalizedCoords.pageNumber || 0
  };
};

/**
 * Get the current dimensions of the PDF container
 */
export const getContainerDimensions = (containerElement) => {
  if (!containerElement) {
    return { width: 0, height: 0 };
  }
  
  const rect = containerElement.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
};

/**
 * Calculate position relative to PDF page
 */
export const getRelativePosition = (absolutePosition, containerElement) => {
  const rect = containerElement.getBoundingClientRect();
  return {
    x: absolutePosition.x - rect.left,
    y: absolutePosition.y - rect.top
  };
};
