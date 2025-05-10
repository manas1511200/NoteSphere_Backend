const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/notes/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}${ext}`;
    console.log('Saving file:', { originalName: file.originalname, filename, mimeType: file.mimetype });
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF is allowed!'), false);
  }
  // Validate PDF signature
  const stream = file.stream || require('stream').Readable.from(file.buffer || file);
  let header = '';
  stream.on('data', (chunk) => {
    header += chunk.toString('ascii');
    if (header.length >= 8) {
      stream.destroy();
      if (!header.startsWith('%PDF-')) {
        return cb(new Error('File is not a valid PDF'), false);
      }
      cb(null, true);
    }
  });
  stream.on('error', (err) => cb(err, false));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;