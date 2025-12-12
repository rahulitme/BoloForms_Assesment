const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { calculateBufferHash } = require('../utils/hashUtils');
const { browserToPdfCoordinates } = require('../utils/coordinateUtils');

/**
 * Process and inject fields (signature, text, etc.) into PDF
 * Handles aspect ratio preservation and coordinate transformation
 */
class PdfProcessor {
  /**
   * Inject signature image into PDF
   * @param {Buffer} pdfBuffer - Original PDF buffer
   * @param {Object} signatureData - Signature data including image and coordinates
   * @returns {Promise<Buffer>} - Modified PDF buffer
   */
  async injectSignature(pdfBuffer, signatureData) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const { imageBase64, coordinates, viewportDimensions } = signatureData;

    // Get the page
    const pages = pdfDoc.getPages();
    const pageIndex = coordinates.pageNumber || 0;
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert browser coordinates to PDF coordinates
    const pdfCoords = browserToPdfCoordinates(
      coordinates,
      viewportDimensions,
      { width: pageWidth, height: pageHeight }
    );

    // Load the signature image
    let image;
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Detect image type and embed
    if (imageBase64.includes('image/png')) {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (imageBase64.includes('image/jpeg') || imageBase64.includes('image/jpg')) {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error('Unsupported image format. Use PNG or JPEG.');
    }

    // Calculate aspect ratio preserving dimensions
    const imageDims = image.scale(1);
    const boxAspectRatio = pdfCoords.width / pdfCoords.height;
    const imageAspectRatio = imageDims.width / imageDims.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imageAspectRatio > boxAspectRatio) {
      // Image is wider - fit to width
      drawWidth = pdfCoords.width;
      drawHeight = pdfCoords.width / imageAspectRatio;
      offsetX = 0;
      offsetY = (pdfCoords.height - drawHeight) / 2;
    } else {
      // Image is taller - fit to height
      drawHeight = pdfCoords.height;
      drawWidth = pdfCoords.height * imageAspectRatio;
      offsetX = (pdfCoords.width - drawWidth) / 2;
      offsetY = 0;
    }

    // Draw the image centered in the box
    page.drawImage(image, {
      x: pdfCoords.x + offsetX,
      y: pdfCoords.y + offsetY,
      width: drawWidth,
      height: drawHeight
    });

    return await pdfDoc.save();
  }

  /**
   * Inject text into PDF
   */
  async injectText(pdfBuffer, textData) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const { text, coordinates, viewportDimensions, fontSize = 12 } = textData;

    const pages = pdfDoc.getPages();
    const pageIndex = coordinates.pageNumber || 0;
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const pdfCoords = browserToPdfCoordinates(
      coordinates,
      viewportDimensions,
      { width: pageWidth, height: pageHeight }
    );

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(text, {
      x: pdfCoords.x + 5, // Small padding
      y: pdfCoords.y + (pdfCoords.height / 2) - (fontSize / 2),
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });

    return await pdfDoc.save();
  }

  /**
   * Inject date into PDF
   */
  async injectDate(pdfBuffer, dateData) {
    const { date, ...rest } = dateData;
    return this.injectText(pdfBuffer, { text: date, ...rest });
  }

  /**
   * Inject radio button selection into PDF
   */
  async injectRadio(pdfBuffer, radioData) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const { selected, coordinates, viewportDimensions } = radioData;

    const pages = pdfDoc.getPages();
    const pageIndex = coordinates.pageNumber || 0;
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const pdfCoords = browserToPdfCoordinates(
      coordinates,
      viewportDimensions,
      { width: pageWidth, height: pageHeight }
    );

    // Draw circle
    const centerX = pdfCoords.x + pdfCoords.width / 2;
    const centerY = pdfCoords.y + pdfCoords.height / 2;
    const radius = Math.min(pdfCoords.width, pdfCoords.height) / 2 - 2;

    // Draw outer circle
    page.drawCircle({
      x: centerX,
      y: centerY,
      radius: radius,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    // Draw filled circle if selected
    if (selected) {
      page.drawCircle({
        x: centerX,
        y: centerY,
        radius: radius * 0.6,
        color: rgb(0, 0, 0)
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Process all fields and inject them into PDF
   * @param {Buffer} pdfBuffer - Original PDF
   * @param {Array} fields - Array of field objects
   * @param {Object} viewportDimensions - Viewport dimensions used when placing fields
   * @returns {Promise<Buffer>} - Final PDF with all fields injected
   */
  async processAllFields(pdfBuffer, fields, viewportDimensions) {
    let currentPdfBuffer = pdfBuffer;

    for (const field of fields) {
      const fieldData = {
        ...field,
        viewportDimensions
      };

      switch (field.type) {
        case 'signature':
          if (field.imageBase64) {
            currentPdfBuffer = await this.injectSignature(currentPdfBuffer, fieldData);
          }
          break;
        case 'text':
          if (field.text) {
            currentPdfBuffer = await this.injectText(currentPdfBuffer, fieldData);
          }
          break;
        case 'date':
          if (field.date) {
            currentPdfBuffer = await this.injectDate(currentPdfBuffer, fieldData);
          }
          break;
        case 'radio':
          currentPdfBuffer = await this.injectRadio(currentPdfBuffer, fieldData);
          break;
        case 'image':
          if (field.imageBase64) {
            currentPdfBuffer = await this.injectSignature(currentPdfBuffer, fieldData);
          }
          break;
      }
    }

    return currentPdfBuffer;
  }
}

module.exports = new PdfProcessor();
