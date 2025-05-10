const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');

dotenv.config();

// Initialize uploads directory
const uploadDir = path.join(__dirname, 'Uploads/notes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.chmodSync(uploadDir, '755'); // Ensure directory is writable
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadDir, req.path);
  console.log('Serving static file:', filePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  express.static(uploadDir)(req, res, next);
});

// Public download route for PDFs
app.get('/download/notes/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  console.log('Download requested:', filePath);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Download Error:', err);
        res.status(500).json({ message: 'Failed to download file' });
      }
    });
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});
app.use('/uploads', express.static(uploadDir));
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

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  if (err instanceof mongoose.Error) {
    return res.status(400).json({ success: false, message: `MongoDB Error: ${err.message}` });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Multer Error: ${err.message}` });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});