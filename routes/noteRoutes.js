const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.post(
  '/',
  auth.verifyToken,
  upload.single('file'),
  noteController.createNote
);

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.put('/:id', upload.single('file'), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

router.get('/user/:userId', noteController.getNotesByUserId);
router.get('/subject/:subject', noteController.getNotesBySubject);
router.get('/search/:query', noteController.searchNotes);
router.get('/download/:id', noteController.downloadPDF);
router.get('/view/:id', noteController.viewPDF);

module.exports = router;