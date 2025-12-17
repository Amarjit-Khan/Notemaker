const mongoose = require('mongoose');
const Note = require('./models/note.model');

const uri = "mongodb://127.0.0.1:27017/notemaker";

const run = async () => {
    try {
        console.log("Connecting to " + uri);
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected.");

        const note = new Note({
            title: "Debug Final",
            blocks: [{ localId: "123", type: "text", content: "Debug Content" }],
            priority: "Low",
            color: "#ffffff"
        });

        console.log("Saving...");
        await note.save();
        console.log("Saved Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("SAVE ERROR:", err);
        process.exit(1);
    }
};

run();
