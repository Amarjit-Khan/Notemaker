const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BlockSchema = new Schema({
    localId: { type: String, required: true },
    type: { type: String, enum: ['text', 'todo', 'h1', 'h2', 'h3'], default: 'text' },
    content: { type: String, default: '' },
    isChecked: { type: Boolean, default: false },
    indent: { type: Number, default: 0 }
}, { _id: false });

const NoteSchema = new Schema({
    title: {
        type: String,
        default: ''
    },
    blocks: {
        type: [BlockSchema],
        default: []
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    position: {
        type: Number,
        default: () => Date.now()
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    backgroundImage: {
        type: String,
        default: ''
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isTrashed: {
        type: Boolean,
        default: false
    },
    trashedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
});

NoteSchema.index({ trashedAt: 1 }, { expireAfterSeconds: 432000 });

module.exports = mongoose.model('Note', NoteSchema);
