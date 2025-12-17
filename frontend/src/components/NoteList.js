import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { MdArchive, MdNote } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import api from '../services/api';
import NoteCard from './NoteCard';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

// Sortable Item Wrapper
const SortableNoteItem = ({ note, children }) => {
    // We pass `children` which is the NoteCard wrapped in a div.
    // The Style needs to handle transform.
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note._id });

    // dnd-kit transform + framer motion inside?
    // We need dnd-kit to control position during drag.
    // Framer motion controls entry/exit and layout.
    // When dragging, we might want to disable framer motion layout?

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none', // Important for touch devices
        zIndex: isDragging ? 999 : 'auto'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

const NoteList = ({ status, refreshTrigger, onUpdate, onNoteClick, theme }) => {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState(null); // For DragOverlay

    // Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const fetchNotes = async () => {
        try {
            setIsLoading(true);
            const queryStatus = status === 'notes' ? 'active'
                : status === 'archive' ? 'archived'
                    : status;
            const response = await api.getNotes(queryStatus);
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [status, refreshTrigger]);

    const handleAction = async (action, note, data) => {
        if (['archive', 'trash', 'delete'].includes(action)) {
            // Optimistic update
            // We want to animate the removal. Framer Motion 'layout' prop handles other items moving.
            // But removing the item from DOM stops it from animating out unless we use AnimatePresence.
            // However, AnimatePresence with Masonry is tough.
            // Let's just update state, and let the remaining items animate (if we use layout prop).
            setNotes(prevNotes => prevNotes.filter(n => n._id !== note._id));
        }

        if (action === 'update') {
            setNotes(prevNotes => prevNotes.map(n => n._id === note._id ? { ...n, ...data } : n));
        }

        try {
            if (action === 'archive') {
                await api.updateNote(note._id, { isArchived: !note.isArchived });
            } else if (action === 'trash') {
                await api.updateNote(note._id, { isTrashed: true });
            } else if (action === 'restore') {
                await api.updateNote(note._id, { isTrashed: false, isArchived: false });
                setNotes(prevNotes => prevNotes.filter(n => n._id !== note._id));
            } else if (action === 'delete') {
                await api.deleteNote(note._id);
            } else if (action === 'update') {
                await api.updateNote(note._id, data);
            }
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Action failed", error);
            fetchNotes();
        }
    };

    // Dynamic Sizing Logic
    const getNoteSizeClass = (note) => {
        let textLength = 0;
        if (note.blocks) {
            textLength = note.blocks.reduce((acc, b) => acc + (b.content ? b.content.length : 0), 0);
        }
        const isLarge = textLength > 300 || (note.blocks && note.blocks.length > 8);
        return isLarge ? 'note-span-2' : '';
    };

    // Drag End Handler
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            const activeNote = notes.find(n => n._id === active.id);
            const overNote = notes.find(n => n._id === over.id);

            // Enforce Priority Boundaries: Only allow reordering within the same priority
            if (activeNote && overNote && activeNote.priority !== overNote.priority) {
                return; // Snap back, do not reorder
            }

            setNotes((items) => {
                const oldIndex = items.findIndex(n => n._id === active.id);
                const newIndex = items.findIndex(n => n._id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const draggedNote = newItems[newIndex];
                const prevNote = newItems[newIndex - 1];
                const nextNote = newItems[newIndex + 1];

                let newPos;
                const buffer = 100000;

                if (!prevNote && !nextNote) {
                    newPos = Date.now();
                } else if (!prevNote) {
                    newPos = (nextNote.position || Date.now()) + buffer;
                } else if (!nextNote) {
                    newPos = (prevNote.position || 0) - buffer;
                } else {
                    const prevPos = prevNote.position || 0;
                    const nextPos = nextNote.position || 0;
                    newPos = (prevPos + nextPos) / 2;
                }

                // Call API
                api.updateNote(draggedNote._id, { position: newPos }).catch(err => {
                    console.error("Failed to update order", err);
                    fetchNotes();
                });

                draggedNote.position = newPos;

                return newItems;
            });
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', opacity: 0.5 }}>Loading...</div>;
    }

    if (notes.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60vh',
                    color: 'var(--text-secondary)',
                    marginTop: '40px'
                }}
            >
                <div style={{ fontSize: '7rem', opacity: 0.1, marginBottom: '20px' }}>
                    {status === 'archive' ? <MdArchive /> :
                        status === 'trash' ? <FaTrash /> :
                            <MdNote />}
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                    {status === 'archive' ? 'No archived notes' :
                        status === 'trash' ? 'No trash notes' :
                            'Notes you add appear here'}
                </h2>
            </motion.div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 10px' }}>
            {status === 'trash' && notes.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    marginBottom: '30px',
                    padding: '15px',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px'
                }}>
                    <span>Notes in Trash are deleted forever.</span>
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to empty the trash? This cannot be undone.")) {
                                try {
                                    await api.emptyTrash();
                                    fetchNotes();
                                } catch (error) {
                                    console.error("Failed to empty trash", error);
                                }
                            }
                        }}
                        style={{
                            background: 'transparent',
                            color: '#4a90e2', // Google Keep blue-ish
                            border: 'none',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                        className="hover-effect"
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Empty Trash
                    </button>
                </div>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={notes.map(n => n._id)} strategy={rectSortingStrategy}>
                    <Masonry
                        breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                    >
                        {notes.map(note => (
                            <SortableNoteItem key={note._id} note={note}>
                                <motion.div
                                    className={`note-wrapper ${getNoteSizeClass(note)}`}
                                    style={{
                                        cursor: note.isTrashed ? 'default' : 'grab',
                                    }}
                                    onClick={() => !note.isTrashed && onNoteClick(note)}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                    <NoteCard
                                        note={note}
                                        onAction={handleAction}
                                        theme={theme}
                                    />
                                </motion.div>
                            </SortableNoteItem>
                        ))}
                    </Masonry>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className="note-wrapper" style={{ transform: 'none' }}>
                            <NoteCard note={notes.find(n => n._id === activeId)} theme={theme} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default NoteList;
