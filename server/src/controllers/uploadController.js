/**
 * uploadController.js
 *
 * Handles POST /api/upload
 * - Receives the PDF buffer from multer (memoryStorage)
 * - Parses it with pdf-parse to extract raw text
 * - Returns structured JSON: metadata + extracted text
 */

const { extractTextFromPDF } = require('../services/pdfExtractor');

/**
 * POST /api/upload
 *
 * Expects multipart/form-data with:
 *   Field name : "resume"  (PDF file, required)
 *
 * Returns:
 * {
 *   success : true,
 *   data: {
 *     file     : { name, sizeBytes, mimeType, pages, pdfVersion },
 *     text     : <full extracted plain text>,
 *     wordCount: <number of words>,
 *     preview  : <first 300 chars of text>
 *   }
 * }
 */
const uploadAndExtract = async (req, res) => {
  // ── 1. Validate file presence ──────────────────────────────────────────────
  if (!req.file) {
    return res.status(422).json({
      success: false,
      message: 'No file received. Send a PDF using the field name "resume".',
    });
  }

  // ── 2. Parse PDF buffer ────────────────────────────────────────────────────
  let text = '';
  let pages = 0;
  let pdfVersion = null;
  try {
    const result = await extractTextFromPDF(req.file.buffer);
    text = result.text || '';
    pages = result.numpages || 0;
    pdfVersion = null; // pdfjs-dist doesn't expose format version
  } catch (err) {
    return res.status(422).json({
      success: false,
      message: 'Could not parse the PDF. Make sure it is a valid, non-encrypted PDF.',
      detail: err.message,
    });
  }

  // ── 3. Clean extracted text ────────────────────────────────────────────────
  const rawText = text || '';

  // Collapse excessive blank lines / trailing spaces
  const cleanText = rawText
    .replace(/\r\n/g, '\n')          // normalise line endings
    .replace(/[ \t]+$/gm, '')        // strip trailing whitespace per line
    .replace(/\n{3,}/g, '\n\n')      // collapse 3+ blank lines → 2
    .trim();

  const words = cleanText.split(/\s+/).filter(Boolean);

  // ── 4. Respond ─────────────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    data: {
      file: {
        name      : req.file.originalname,
        sizeBytes : req.file.size,
        mimeType  : req.file.mimetype,
        pages     : pages,
        pdfVersion: pdfVersion,
      },
      text     : cleanText,
      wordCount: words.length,
      preview  : cleanText.slice(0, 300),
    },
  });
};

module.exports = { uploadAndExtract };
