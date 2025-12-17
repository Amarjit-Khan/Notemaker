const router = require('express').Router();
let Note = require('../models/note.model');

// GET notes based on status
router.route('/').get((req, res) => {
    const status = req.query.status || 'active';

    let query = {};

    if (status === 'active') {
        query = { isTrashed: false, isArchived: false };
    } else if (status === 'archived' || status === 'archive') {
        query = { isTrashed: false, isArchived: true };
    } else if (status === 'trash') {
        query = { isTrashed: true };
    }

    Note.aggregate([
        { $match: query },
        {
            $addFields: {
                priorityWeight: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$priority", "High"] }, then: 3 },
                            { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                            { case: { $eq: ["$priority", "Low"] }, then: 1 }
                        ],
                        default: 0
                    }
                }
            }
        },
        { $sort: { isPinned: -1, priorityWeight: -1, position: -1, updatedAt: -1 } }
    ])
        .then(notes => res.json(notes))
        .catch(err => res.status(400).json('Error: ' + err));
});

// ADD new note
router.route('/').post((req, res) => {
    const { title, blocks, priority, color, backgroundImage, isPinned, isArchived, isTrashed, position } = req.body;

    const newNote = new Note({
        title,
        blocks,
        priority,
        color,
        backgroundImage,
        isPinned,
        isArchived,
        isTrashed,
        position
    });

    newNote.save()
        .then(note => res.json(note))
        .catch(err => {
            console.error("Mongoose Save Error:", err);
            res.status(400).json('Error: ' + err);
        });
});

// UPDATE note
router.route('/trash').delete((req, res) => {
    Note.deleteMany({ isTrashed: true })
        .then(() => res.json('Trash emptied.'))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').put((req, res) => {
    Note.findById(req.params.id)
        .then(note => {
            note.title = req.body.title ?? note.title;
            note.blocks = req.body.blocks ?? note.blocks;
            note.priority = req.body.priority ?? note.priority;
            note.position = req.body.position ?? note.position; // Allow position update
            note.color = req.body.color ?? note.color;
            note.backgroundImage = req.body.backgroundImage ?? note.backgroundImage;
            note.isPinned = req.body.isPinned ?? note.isPinned;
            note.isArchived = req.body.isArchived ?? note.isArchived;

            // Handle Trash logic
            if (req.body.isTrashed !== undefined) {
                note.isTrashed = req.body.isTrashed;
                note.trashedAt = note.isTrashed ? new Date() : null;
                // If moving to trash, it's still archived? 
                // The query `isTrashed: false` should filter it from Archive view.
                // But let's verify.
            }

            // Handle Archive: If archiving, ensure not trashed?
            if (req.body.isArchived !== undefined) {
                note.isArchived = req.body.isArchived;
                if (note.isArchived) note.isTrashed = false; // logic check
            }

            note.save()
                .then(updatedNote => res.json(updatedNote))
                .catch(err => res.status(400).json('Error: ' + err));
        })
        .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE note (Permanent)
router.route('/:id').delete((req, res) => {
    Note.findByIdAndDelete(req.params.id)
        .then(() => res.json('Note deleted permanently.'))
        .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
