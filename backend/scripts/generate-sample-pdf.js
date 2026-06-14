const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');

async function main() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const lines = [
    'John Doe - Software Engineer',
    'john.doe@email.com | github.com/johndoe',
    '',
    'EXPERIENCE',
    'Software Developer | Tech Company | 2020-Present',
    '- Built web applications using React and Node.js',
    '- Improved application performance and fixed bugs',
    '- Collaborated with cross-functional teams on product features',
    '',
    'SKILLS: JavaScript, React, HTML, CSS, Git, Node.js, SQL',
  ];

  let y = 750;
  for (const line of lines) {
    page.drawText(line, { x: 72, y, size: 12, font });
    y -= 20;
  }

  const bytes = await pdfDoc.save();
  const outPath = path.join(__dirname, '..', 'test-fixtures', 'sample-resume.pdf');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
