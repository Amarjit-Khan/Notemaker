const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notemaker')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
// Routes
const notesRouter = require('./routes/notes.routes');
const uploadRouter = require('./routes/upload.routes');

app.use('/api/notes', notesRouter);
app.use('/api/upload', uploadRouter);

// Serve Static Uploads
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Notemaker API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
