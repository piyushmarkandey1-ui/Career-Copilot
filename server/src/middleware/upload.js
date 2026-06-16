/**
 * multer middleware — accepts PDF uploads only (max 10 MB).
 * Stored in memory so controllers can forward the buffer to an AI API
 * without touching the filesystem.
 */
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only PDF resumes are supported.'), { status: 422 }),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

module.exports = upload;
