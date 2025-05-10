const Note = require('../models/Note');
const User = require('../models/User');
const fs = require('fs');

exports.createNote = async (req, res) => {
  try {
    const { title, subject, topics } = req.body;
    const filePath = req.file ? req.file.path : null;
    const userId = req.user._id;

    // Log for debugging
    console.log('Creating note:', { title, subject, topics, filePath, userId, originalName: req.file?.originalname, mimeType: req.file?.mimetype, size: req.file?.size });

    // Validate required fields
    if (!title || !subject) {
      return res.status(400).json({ message: 'Title and subject are required' });
    }
    if (req.file) {
      // Verify saved file is a valid PDF
      const fileContent = fs.readFileSync(filePath, { encoding: 'ascii', flag: 'r' });
      if (!fileContent.startsWith('%PDF-')) {
        fs.unlinkSync(filePath); // Remove invalid file
        return res.status(400).json({ message: 'Uploaded file is not a valid PDF' });
      }
    }

    const newNote = new Note({
      title,
      subject,
      topics: topics ? topics.split(',').map(topic => topic.trim()) : [],
      filePath,
      user: userId
    });

    await newNote.save();
    res.status(201).json({ message: 'Note created successfully', note: newNote });
  } catch (err) {
    console.error('Create Note Error:', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Clean up on error
    }
    res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).populate('user', 'username email college profilePhotoUri');
    res.status(200).json(notes);
  } catch (err) {
    console.error('Get Notes Error:', err);
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('user', 'username email college profilePhotoUri');
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (err) {
    console.error('Get Note By ID Error:', err);
    res.status(500).json({ message: 'Failed to fetch note', error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, subject, topics } = req.body;
    const filePath = req.file ? req.file.path : null;
    const noteId = req.params.id;

    if (req.file) {
      const fileContent = fs.readFileSync(filePath, { encoding: 'ascii', flag: 'r' });
      if (!fileContent.startsWith('%PDF-')) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: 'Uploaded file is not a valid PDF' });
      }
    }

    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        title,
        subject,
        topics: topics ? topics.split(',').map(topic => topic.trim()) : [],
        ...(filePath && { filePath })
      },
      { new: true }
    );

    if (!updatedNote) {
      if (req.file && req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ message: 'Note updated successfully', note: updatedNote });
  } catch (err) {
    console.error('Update Note Error:', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to update note', error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete Note Error:', err);
    res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
};

exports.getNotesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notes = await Note.find({ user: userId }).populate('user', 'username email college profilePhotoUri');
    res.status(200).json(notes);
  } catch (err) {
    console.error('Get Notes By User ID Error:', err);
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};

exports.getNotesBySubject = async (req, res) => {
  try {
    const subject = req.params.subject;
    const notes = await Note.find({ subject }).populate('user', 'username email college profilePhotoUri');
    res.status(200).json(notes);
  } catch (err) {
    console.error('Get Notes By Subject Error:', err);
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
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
    }).populate('user', 'username email college profilePhotoUri');
    res.status(200).json(notes);
  } catch (err) {
    console.error('Search Notes Error:', err);
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};