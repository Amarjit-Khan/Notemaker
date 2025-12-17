try {
    console.log("Starting sanity check...");
    const mongoose = require('mongoose');
    console.log("Mongoose required.");
    const Note = require('./models/note.model');
    console.log("Note Model required.");
} catch (e) {
    console.error("CRASH:", e);
}
