const { PDFParse } = require('pdf-parse');

/**
 * Extract text and metadata from a PDF buffer.
 * Uses pdf-parse v2 (PDFParse class).
 */
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo().catch(() => null),
    ]);

    const text = (textResult.text || '').trim();
    const numPages = textResult.total ?? infoResult?.total ?? 1;

    return {
      text,
      numpages: numPages,
      info: infoResult?.info ?? null,
    };
  } finally {
    await parser.destroy();
  }
}

module.exports = { extractPdfText };
