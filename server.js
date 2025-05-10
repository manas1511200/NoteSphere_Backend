const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');

dotenv.config();

// Initialize upload directories
const uploadDirNotes = path.join(__dirname, 'Uploads/notes');
const uploadDirProfiles = path.join(__dirname, 'Uploads/profiles');
[uploadDirNotes, uploadDirProfiles].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.chmodSync(dir, '755'); // Ensure directories are writable
  }
});

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files with error handling
app.use('/uploads/notes', (req, res, next) => {
  const filePath = path.join(uploadDirNotes, req.path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  express.static(uploadDirNotes)(req, res, next);
});
app.use('/uploads/profiles', (req, res, next) => {
  const filePath = path.join(uploadDirProfiles, req.path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  express.static(uploadDirProfiles)(req, res, next);
});

// Public download route for PDFs
app.get('/download/notes/:filename', (req, res) => {
  const filePath = path.join(uploadDirNotes, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Download Error:', err);
      res.status(500).json({ message: 'Failed to download file', error: err.message });
    }
  });
});

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  if (err instanceof mongoose.Error) {
    return res.status(400).json({ success: false, message: `MongoDB Error: ${err.message}` });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `File Upload Error: ${err.message}` });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});