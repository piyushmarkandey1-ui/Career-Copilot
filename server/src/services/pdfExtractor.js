/**
 * pdfExtractor.js
 *
 * Extracts plain text from a PDF buffer.
 * Uses pdf-parse as the primary engine (highly stable in serverless environments)
 * and falls back to pdfjs-dist legacy builder if pdf-parse fails.
 */

const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - Raw PDF file buffer
 * @returns {Promise<{ text: string, numpages: number }>}
 */
async function extractTextFromPDF(buffer) {
  try {
    console.log('[pdfExtractor] Attempting extraction with pdf-parse...');
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    
    // If we extracted a reasonable amount of text, return it
    if (text.length > 50) {
      return { text, numpages: data.numpages || 1 };
    }
    throw new Error('pdf-parse returned empty or insufficient text.');
  } catch (err) {
    console.warn('[pdfExtractor] pdf-parse failed or returned empty. Falling back to pdfjs-dist:', err.message);
    
    try {
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
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
    } catch (fallbackErr) {
      console.error('[pdfExtractor] Both pdf-parse and pdfjs-dist failed:', fallbackErr);
      throw new Error('Failed to extract text from PDF: ' + fallbackErr.message);
    }
  }
}

module.exports = { extractTextFromPDF };
