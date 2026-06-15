/**
 * pdfExtractor.js
 *
 * Extracts plain text from a PDF buffer using pdfjs-dist,
 * which supports all modern PDF compression formats (including ones
 * that pdf-parse v1 fails on with "Invalid PDF structure").
 */

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Disable worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = null;

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - Raw PDF file buffer
 * @returns {Promise<{ text: string, numpages: number }>}
 */
async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    // Silence verbose internal warnings
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pageTexts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText.trim());
  }

  const fullText = pageTexts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();

  return { text: fullText, numpages: numPages };
}

module.exports = { extractTextFromPDF };
