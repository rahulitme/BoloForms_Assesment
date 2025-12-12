const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function createSamplePDF() {
  // Create a new PDF Document
  const pdfDoc = await PDFDocument.create();

  // Add a page (A4 size: 595.28 x 841.89 points)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw header
  page.drawText('EMPLOYMENT CONTRACT', {
    x: 50,
    y: height - 50,
    size: 24,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.8)
  });

  // Draw horizontal line
  page.drawLine({
    start: { x: 50, y: height - 60 },
    end: { x: width - 50, y: height - 60 },
    thickness: 2,
    color: rgb(0.2, 0.2, 0.8)
  });

  // Document content
  const content = [
    { text: 'This Employment Contract ("Agreement") is entered into on this date between:', y: height - 100 },
    { text: 'EMPLOYER: BoloForms Inc.', y: height - 130, bold: true },
    { text: 'Address: 123 Tech Street, San Francisco, CA 94105', y: height - 150 },
    { text: 'EMPLOYEE: [Employee Name]', y: height - 180, bold: true },
    { text: 'Address: [Employee Address]', y: height - 200 },
    { text: '1. POSITION AND DUTIES', y: height - 240, bold: true },
    { text: 'The Employee is hired for the position of Software Engineer. The Employee agrees', y: height - 260 },
    { text: 'to perform all duties and responsibilities associated with this position.', y: height - 275 },
    { text: '2. COMPENSATION', y: height - 310, bold: true },
    { text: 'The Employee will receive an annual salary of $120,000, payable in accordance', y: height - 330 },
    { text: 'with the Company\'s standard payroll practices.', y: height - 345 },
    { text: '3. START DATE', y: height - 380, bold: true },
    { text: 'Employment will commence on: _______________', y: height - 400 },
    { text: '4. BENEFITS', y: height - 435, bold: true },
    { text: 'The Employee is entitled to health insurance, dental coverage, and 401(k) matching.', y: height - 455 },
    { text: '[ ] I accept the health insurance package', y: height - 480 },
    { text: '[ ] I decline the health insurance package', y: height - 500 },
    { text: '5. CONFIDENTIALITY', y: height - 535, bold: true },
    { text: 'The Employee agrees to maintain confidentiality of all proprietary information', y: height - 555 },
    { text: 'and trade secrets of the Company during and after employment.', y: height - 570 },
    { text: '6. TERMINATION', y: height - 605, bold: true },
    { text: 'Either party may terminate this Agreement with 30 days written notice.', y: height - 625 },
    { text: 'SIGNATURES', y: height - 670, bold: true },
    { text: 'Employee Signature: _______________________  Date: _______________', y: height - 700 },
    { text: 'Employer Signature: _______________________  Date: _______________', y: height - 730 },
  ];

  // Draw content
  content.forEach(item => {
    page.drawText(item.text, {
      x: 50,
      y: item.y,
      size: item.bold ? 14 : 11,
      font: item.bold ? boldFont : regularFont,
      color: rgb(0, 0, 0)
    });
  });

  // Draw footer
  page.drawText('Page 1 of 1', {
    x: width / 2 - 30,
    y: 30,
    size: 10,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  
  // Create pdfs directory if it doesn't exist
  const pdfsDir = path.join(__dirname, 'pdfs');
  try {
    await fs.access(pdfsDir);
  } catch {
    await fs.mkdir(pdfsDir, { recursive: true });
  }

  // Write to file
  const outputPath = path.join(pdfsDir, 'sample-contract.pdf');
  await fs.writeFile(outputPath, pdfBytes);
  
  console.log('✅ Sample PDF created successfully!');
  console.log(`📄 Location: ${outputPath}`);
  console.log('📝 This PDF includes areas for:');
  console.log('   - Employee name (text field)');
  console.log('   - Start date (date field)');
  console.log('   - Health insurance selection (radio buttons)');
  console.log('   - Employee signature');
  console.log('   - Employer signature');
}

createSamplePDF().catch(console.error);
