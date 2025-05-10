const Note = require('../models/Note');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.createNote = async (req, res) => {
  try {
    const { title, subject, topics } = req.body;
    const filePath = req.file ? req.file.path : null;
    const userId = req.user._id;

    if (!title || !subject) {
      if (filePath) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Title and subject are required' });
    }

    const newNote = new Note({
      title,
      subject,
      topics: topics ? topics.split(',').map(t => t.trim()) : [],
      filePath,
      user: userId
    });

    await newNote.save();
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: newNote,
      downloadUrl: filePath ? `/api/notes/download/${newNote._id}` : null
    });
  } catch (err) {
    console.error('Create Note Error:', err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to create note', error: err.message });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    if (!note.filePath || !fs.existsSync(note.filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file missing' });
    }
    const filename = path.basename(note.filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const fileStream = fs.createReadStream(note.filePath);
    fileStream.on('error', (err) => {
      console.error('File Stream Error:', err);
      res.status(500).json({ success: false, message: 'Failed to stream PDF' });
    });
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download PDF Error:', err);
    res.status(500).json({ success: false, message: 'Failed to download PDF', error: err.message });
  }
};

exports.viewPDF = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    if (!note.filePath || !fs.existsSync(note.filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file missing' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    const fileStream = fs.createReadStream(note.filePath);
    fileStream.on('error', (err) => {
      console.error('File Stream Error:', err);
      res.status(500).json({ success: false, message: 'Failed to stream PDF' });
    });
    fileStream.pipe(res);
  } catch (err) {
    console.error('View PDF Error:', err);
    res.status(500).json({ success: false, message: 'Failed to view PDF', error: err.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).populate('user', 'username email college profilePhotoPath');
    res.status(200).json({ success: true, notes });
  } catch (err) {
    console.error('Get Notes Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: err.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('user', 'username email college profilePhotoPath');
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.status(200).json({ success: true, note });
  } catch (err) {
    console.error('Get Note By ID Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch note', error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, subject, topics } = req.body;
    const filePath = req.file ? req.file.path : null;
    const note = await Note.findById(req.params.id);
    if (!note) {
      if (filePath) fs.unlinkSync(filePath);
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    note.title = title || note.title;
    note.subject = subject || note.subject;
    note.topics = topics ? topics.split(',').map(t => t.trim()) : note.topics;
    if (filePath) {
      if (note.filePath && fs.existsSync(note.filePath)) fs.unlinkSync(note.filePath);
      note.filePath = filePath;
    }
    await note.save();
    res.status(200).json({ success: true, message: 'Note updated successfully', note });
  } catch (err) {
    console.error('Update Note Error:', err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to update note', error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    if (note.filePath && fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }
    await note.remove();
    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete Note Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete note', error: err.message });
  }
};

exports.getNotesByUserId = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.params.userId }).populate('user', 'username email college profilePhotoPath');
    res.status(200).json({ success: true, notes });
  } catch (err) {
    console.error('Get Notes By User ID Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: err.message });
  }
};

exports.getNotesBySubject = async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject }).populate('user', 'username email college profilePhotoPath');
    res.status(200).json({ success: true, notes });
  } catch (err) {
    console.error('Get Notes By Subject Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: err.message });
  }
};

exports.searchNotes = async (req, res) => {
  try {
    const query = req.params.query;
    const notes = await Note.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { subject: { $regex: query, $options: 'i' } },
        { topics: { $regex: query, $options: 'i' } }
      ]
    }).populate('user', 'username email college profilePhotoPath');
    res.status(200).json({ success: true, notes });
  } catch (err) {
    console.error('Search Notes Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: err.message });
  }
};