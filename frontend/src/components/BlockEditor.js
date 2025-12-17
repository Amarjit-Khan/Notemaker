import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaCheckSquare, FaImage, FaPalette, FaSave, FaTrash, FaUndo, FaRedo, FaBold, FaItalic, FaUnderline, FaRemoveFormat } from 'react-icons/fa';
import { MdDragIndicator, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';
import EditableBlock from './EditableBlock';
import useUndoRedo from '../hooks/useUndoRedo';
import { BACKGROUNDS, getBackgroundComponent } from './NoteBackgrounds';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';




// Sortable Block Component
const SortableBlock = ({
    id, block, index, readOnly, isActive,
    updateBlock, handleBlockKeyDown, setActiveBlockIndex, addBlocks, toggleBlockType
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '8px',
        paddingLeft: `${block.indent * 24}px`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style}>
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                style={{ display: 'flex', alignItems: 'center', marginTop: '6px', marginRight: '8px', cursor: 'grab', opacity: 0.5, flexShrink: 0 }}
                contentEditable={false} // Ensure not editable
            >
                <MdDragIndicator size={14} />
            </div>

            {block.type === 'todo' && (
                <div onClick={() => updateBlock(index, { isChecked: !block.isChecked })} style={{ marginTop: '4px', marginRight: '8px', cursor: 'pointer', flexShrink: 0 }}>
                    {block.isChecked ? <MdCheckBox size={20} /> : <MdCheckBoxOutlineBlank size={20} />}
                </div>
            )}

            <EditableBlock
                className="block-input"
                tagName="div"
                html={block.content}
                onChange={(newHtml) => !readOnly && updateBlock(index, { content: newHtml })}
                onKeyDown={(e) => !readOnly && handleBlockKeyDown(e, index)}
                onFocus={() => setActiveBlockIndex(index)}
                placeholder={readOnly ? "" : (block.type === 'todo' ? "List item" : "Note text...")}
                fontSize={block.fontSize || 16}
                readOnly={readOnly}
                style={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: block.type === 'h1' || block.type === 'h2' ? 'bold' : 'normal',
                    lineHeight: '1.5',
                    textDecoration: block.isChecked ? 'line-through' : 'none',
                    opacity: block.isChecked ? 0.6 : 1,
                    minHeight: '24px',
                    outline: 'none',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    marginBottom: '0'
                }}
                onSplitPaste={(lines) => addBlocks(index, lines)}
            />

            <div
                onClick={() => toggleBlockType(index)}
                style={{ marginLeft: '10px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, flexShrink: 0, cursor: 'pointer' }}
                title="Toggle List/Text"
            >
                {block.type === 'text' || block.type === 'h1' || block.type === 'h2' ? <FaCheckSquare size={14} /> : 'T'}
            </div>
        </div>
    );
};

const BlockEditor = ({ onNoteAdded, initialNote = null, onClose = null, readOnly = false, showToast }) => {
    // If editing, always start expanded
    const [isExpanded, setIsExpanded] = useState(!!initialNote);

    // State managed by Undo/Redo
    const { state: noteContent, set: setNoteContent, undo, redo, canUndo, canRedo, reset } = useUndoRedo({
        title: initialNote ? initialNote.title : '',
        blocks: initialNote && initialNote.blocks
            ? initialNote.blocks.map(b => ({ ...b, localId: b.localId || uuidv4() }))
            : [{ localId: uuidv4(), type: 'text', content: '', isChecked: false, indent: 0 }]
    });

    const { title, blocks } = noteContent;

    const [priority, setPriority] = useState(initialNote ? initialNote.priority : 'Low');
    const [color, setColor] = useState(initialNote ? initialNote.color : '');
    const [bgImage, setBgImage] = useState(initialNote ? initialNote.backgroundImage : '');

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showImgInput, setShowImgInput] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false); // Collapsible Priority UI State

    // Toolbar State
    const [activeBlockIndex, setActiveBlockIndex] = useState(null);
    const [showToolbar, setShowToolbar] = useState(false); // Not used in this implementation, toolbar is always shown when expanded
    const toolbarRef = useRef(null);

    const containerRef = useRef(null);
    const titleRef = useRef(null);

    // Reset history when initialNote changes (if switching notes in modal)
    useEffect(() => {
        if (initialNote) {
            reset({
                title: initialNote.title,
                blocks: initialNote.blocks
            });
        }
    }, [initialNote, reset]);

    // Update Content Wrapper
    const updateContent = useCallback((updates, addToHistory = true) => {
        setNoteContent({ ...noteContent, ...updates }, addToHistory);
    }, [noteContent, setNoteContent]);

    // Memoized updateBlock to avoid excessive re-renders/history entries on every char
    // We'll debounce history pushes for typing? 
    // For simplicity, let's just update state. Real-time typing history might be too granular if every char is a state.
    // Optimization: We could use a "debounced set" for history.

    const updateBlock = (index, updates) => {
        setNoteContent(prevNoteContent => {
            const newBlocks = [...prevNoteContent.blocks];
            newBlocks[index] = { ...newBlocks[index], ...updates };
            return { ...prevNoteContent, blocks: newBlocks };
        }, true); // For now, every update pushes history. 
    };

    // Global Shortcut - Only active if NOT editing (to avoid conflict)
    useEffect(() => {
        if (initialNote) return;

        const handleGlobalKeyDown = (e) => {
            // Alt + N: New Note
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                setIsExpanded(true);
                setTimeout(() => titleRef.current?.focus(), 100);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [initialNote]);

    // Save Function (Memoized)
    const saveNote = useCallback(async () => {
        const hasContent = blocks.some(b => b.content.trim() !== '');

        if (!title.trim() && !hasContent && !bgImage) {
            if (showToast) showToast("Note cannot be empty");
            else alert("Note cannot be empty");
            return;
        }

        const noteData = {
            title: title ? title.charAt(0).toUpperCase() + title.slice(1) : '',
            blocks: blocks,
            priority,
            color,
            backgroundImage: bgImage,
            isArchived: initialNote ? initialNote.isArchived : false,
            isTrashed: initialNote ? initialNote.isTrashed : false
        };

        try {
            if (initialNote && initialNote._id) {
                await api.updateNote(initialNote._id, noteData);
            } else {
                await api.createNote(noteData);
            }

            if (onNoteAdded) onNoteAdded();
            if (onClose) onClose();

        } catch (error) {
            console.error("Failed to save note", error);
        }
    }, [title, blocks, priority, color, bgImage, onNoteAdded, initialNote, onClose]);

    // Collapsed Reset
    const collapse = () => {
        if (onClose) {
            onClose();
        } else {
            setIsExpanded(false);
            reset({ title: '', blocks: [{ localId: uuidv4(), type: 'text', content: '', isChecked: false, indent: 0 }] });
            setPriority('Low');
            setColor('');
            setBgImage('');
            setShowColorPicker(false);
            setShowImgInput(false);
            setIsPriorityOpen(false);
            setActiveBlockIndex(null);
        }
    };

    // Close/Save on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Determine if we clicked a modal overlay or something external
                // If editing existing note, we might not want to auto-close/save on EVERY click outside if it's just a modal background click which we handle in App.js
                // But for the inline new note editor, we do.

                // If checking for toolbar click:
                if (toolbarRef.current && toolbarRef.current.contains(event.target)) return;

                if (isExpanded && !initialNote) {
                    // Check if empty
                    const hasContent = blocks.some(b => b.content.trim() !== '');
                    if (!title.trim() && !hasContent && !bgImage) {
                        collapse(); // Just close if empty
                    } else {
                        saveNote();
                        collapse();
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, saveNote, initialNote, title, blocks, bgImage]);

    const handleBlockKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            setNoteContent(prev => {
                const newBlock = {
                    localId: uuidv4(),
                    type: 'text',
                    content: '',
                    isChecked: false,
                    indent: prev.blocks[index].indent // Use prev.blocks
                };
                const newBlocks = [...prev.blocks];
                newBlocks.splice(index + 1, 0, newBlock);
                return { ...prev, blocks: newBlocks };
            }, true); // Add to history

            setTimeout(() => {
                const inputs = containerRef.current.querySelectorAll('.block-input');
                if (inputs[index + 1]) inputs[index + 1].focus();
            }, 0);

        } else if (e.key === 'Backspace') {
            // Need to access CURRENT content to decide condition.
            // Problem: We can't synchronously check `prev.blocks[index].content` inside the setState 
            // to decide whether to `preventDefault`.
            // `preventDefault` must happen NOW.

            // If we are using Stale Props, `blocks[index].content` in closure is OLD.
            // If I typed "Hello", `blocks[index].content` might be "".
            // So `blocks[index].content === ''` check returns TRUE (incorrectly!).
            // So it deletes "Hello" block when I press backspace?
            // YES.

            // This is trickier. WE NEED THE LATEST CONTENT to decide logic.
            // But we don't have it in scope if we blocked render.
            // But `EditableBlock` knows its content! `e.target.innerHTML`!

            // FIX: Check `e.target.innerText` (or innerHTML) instead of `blocks[index].content`.
            const currentContent = e.target.innerText.replace(/\n$/, ''); // contentEditable can have trailing newline
            // Or better `e.currentTarget.textContent`.

            if (currentContent === '') {
                // Logic for merge/delete
                if (index > 0) { // Can't delete first block if it is the only one usually, but index check maps to blocks.length check via props?
                    // We need to know blocks.length. 
                    // Stale `blocks.length` might be wrong?
                    // If stale length is 1, but real is 10?
                    // Index is correct (from map).

                    // Let's implement the functional update for the STATE change.
                    // And use `e.target` for the condition.

                    e.preventDefault();
                    setNoteContent(prev => {
                        if (prev.blocks.length <= 1) return prev; // Safety check inside

                        const newBlocks = [...prev.blocks];
                        newBlocks.splice(index, 1);
                        return { ...prev, blocks: newBlocks };
                    }, true);

                    setTimeout(() => {
                        const inputs = containerRef.current.querySelectorAll('.block-input');
                        const prevIdx = Math.max(0, index - 1);
                        if (inputs[prevIdx]) {
                            // We should really place cursor at end of prev block here...
                            inputs[prevIdx].focus();
                            // Ideally move caret to end sets range... omitted for brevity but standard logic implies it
                        }
                    }, 0);
                }
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (blocks[index].type === 'todo') {
                const newIndent = e.shiftKey ? Math.max(0, blocks[index].indent - 1) : Math.min(5, blocks[index].indent + 1);
                updateBlock(index, { indent: newIndent });
            }
        } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        }
    };

    const addBlocks = (index, lines) => {
        setNoteContent(prev => {
            const currentBlock = prev.blocks[index];
            const newBlockObjects = lines.map(line => ({
                localId: uuidv4(),
                type: currentBlock.type, // Inherit type (e.g. todo)
                content: line,
                isChecked: false,
                indent: currentBlock.indent
            }));

            const newBlocks = [...prev.blocks];
            newBlocks.splice(index + 1, 0, ...newBlockObjects);
            return { ...prev, blocks: newBlocks };
        }, true);
    };

    const toggleBlockType = (index) => {
        const newType = blocks[index].type === 'text' || blocks[index].type === 'h1' || blocks[index].type === 'h2' ? 'todo' : 'text';
        updateBlock(index, { type: newType });
    };

    // Active Formats State
    const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });

    useEffect(() => {
        if (!isExpanded) return;

        const handleSelectionChange = () => {
            // Check if current selection has formats
            setActiveFormats(prev => {
                const isBold = document.queryCommandState('bold');
                const isItalic = document.queryCommandState('italic');
                const isUnderline = document.queryCommandState('underline');

                if (prev.bold === isBold && prev.italic === isItalic && prev.underline === isUnderline) {
                    return prev; // No change, return same object to skip re-render
                }
                return { bold: isBold, italic: isItalic, underline: isUnderline };
            });
        };

        // Listen for selection changes document-wide (simplest for contentEditable)
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [isExpanded]);

    // Toolbar Actions
    const formatText = (command, value = null) => {
        document.execCommand(command, false, value);
        // Force update active states immediately after click
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline')
        });
    };

    const setBlockTag = (tag) => {
        if (activeBlockIndex === null) return;
        // Updating block type logic for H1/H2
        // We can store this in 'type' field or just use HTML, but better to use 'type' for structured data if possible.
        // Or just let EditableBlock handle it? 
        // Let's us 'type' for 'h1', 'h2', 'text'.
        updateBlock(activeBlockIndex, { type: tag });
    };

    const [showFontSizePicker, setShowFontSizePicker] = useState(false);

    // Default color is empty string (adapts to theme)
    // Using CSS variables for Google Keep-like adaptive palette
    const colors = [
        { value: '', name: 'Default' },
        { value: 'var(--note-bg-red)', name: 'Red' },
        { value: 'var(--note-bg-orange)', name: 'Orange' },
        { value: 'var(--note-bg-yellow)', name: 'Yellow' },
        { value: 'var(--note-bg-green)', name: 'Green' },
        { value: 'var(--note-bg-teal)', name: 'Teal' },
        { value: 'var(--note-bg-blue)', name: 'Blue' },
        { value: 'var(--note-bg-darkblue)', name: 'Dark Blue' },
        { value: 'var(--note-bg-purple)', name: 'Purple' },
        { value: 'var(--note-bg-pink)', name: 'Pink' },
        { value: 'var(--note-bg-brown)', name: 'Brown' },
        { value: 'var(--note-bg-gray)', name: 'Gray' }
    ];

    const setBlockFontSize = (size) => {
        if (activeBlockIndex === null) return;
        updateBlock(activeBlockIndex, { fontSize: size });
        setShowFontSizePicker(false);
    };

    const currentFontSize = activeBlockIndex !== null && blocks[activeBlockIndex]
        ? (blocks[activeBlockIndex].fontSize || 16)
        : 16;

    const fontSizes = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 40];

    const clearFormatting = () => {
        formatText('removeFormat');
        if (activeBlockIndex !== null) {
            updateBlock(activeBlockIndex, { fontSize: 16 });
        }
        // Reset states
        setActiveFormats({ bold: false, italic: false, underline: false });
    };

    const getBackgroundColor = () => {
        if (!color) return 'var(--note-bg-default)';
        return color;
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        // Safety check: ensure 'over' exists prevents crash if dropped outside
        if (over && active.id !== over.id) {
            setNoteContent((prev) => {
                const oldIndex = prev.blocks.findIndex((b) => b.localId === active.id);
                const newIndex = prev.blocks.findIndex((b) => b.localId === over.id);
                return {
                    ...prev,
                    blocks: arrayMove(prev.blocks, oldIndex, newIndex)
                };
            }, true);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );



    return (
        <div ref={containerRef} className="note-input-container glass-panel" style={{
            backgroundColor: getBackgroundColor(),
            backgroundImage: bgImage && !bgImage.startsWith('preset:') ? `url(${bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            border: '1px solid var(--note-border)',
            transition: 'border-color 0.2s',
            zIndex: 1
        }}>
            {/* Render SVG Background if preset */}
            {bgImage && bgImage.startsWith('preset:') && (
                (() => {
                    const BgComponent = getBackgroundComponent(bgImage);
                    return BgComponent ? <BgComponent /> : null;
                })()
            )}
            {/* Toolbar (Floating or Fixed at Top) */}
            {isExpanded && !readOnly && (
                <div ref={toolbarRef} className="editor-toolbar" style={{
                    display: 'flex', gap: '5px', padding: '8px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(5px)', borderRadius: '12px 12px 0 0',
                    alignItems: 'center', flexWrap: 'wrap'
                }}>
                    <button
                        className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatText('bold')}
                        title="Bold"
                    >
                        <FaBold />
                    </button>
                    <button
                        className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatText('italic')}
                        title="Italic"
                    >
                        <FaItalic />
                    </button>
                    <button
                        className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatText('underline')}
                        title="Underline"
                    >
                        <FaUnderline />
                    </button>

                    {/* Font Size Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="toolbar-btn"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                            title="Font Size"
                            style={{ width: 'auto', padding: '0 8px', fontSize: '0.9rem', gap: '4px' }}
                        >
                            {currentFontSize} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
                        </button>

                        {showFontSizePicker && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: '5px',
                                background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px',
                                maxHeight: '140px', overflowY: 'auto', zIndex: 50,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', minWidth: '60px'
                            }}>
                                {fontSizes.map(size => (
                                    <div
                                        key={size}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => setBlockFontSize(size)}
                                        style={{
                                            padding: '8px 12px', cursor: 'pointer', textAlign: 'center',
                                            background: size === currentFontSize ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            color: 'var(--text-primary)', fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.target.style.background = size === currentFontSize ? 'rgba(255,255,255,0.1)' : 'transparent'}
                                    >
                                        {size}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={clearFormatting} title="Clear Format"><FaRemoveFormat /></button>
                    <div className="divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                    <button className="toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={undo} disabled={!canUndo} title="Undo" style={{ opacity: !canUndo ? 0.3 : 1 }}><FaUndo /></button>
                    <button className="toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={redo} disabled={!canRedo} title="Redo" style={{ opacity: !canRedo ? 0.3 : 1 }}><FaRedo /></button>
                </div>
            )}

            {!isExpanded ? (
                <div style={{ display: 'flex', alignItems: 'center', padding: '15px' }} onClick={() => setIsExpanded(true)}>
                    <input
                        type="text"
                        placeholder="Take a note..."
                        style={{ fontWeight: 500, fontSize: '1rem', cursor: 'text' }}
                        readOnly
                    />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', color: 'var(--text-secondary)' }}>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(true);
                                setNoteContent({
                                    title: '',
                                    blocks: [{ localId: uuidv4(), type: 'todo', content: '', isChecked: false, indent: 0 }]
                                });
                            }}
                            title="New List"
                            style={{ cursor: 'pointer' }}
                        >
                            <FaCheckSquare size={20} />
                        </div>

                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById('image-upload').click();
                                // Expansion handled by onChange of input
                            }}
                            title="New Note with Image"
                            style={{ cursor: 'pointer' }}
                        >
                            <FaImage size={20} />
                        </div>

                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(true);
                                setShowColorPicker(true);
                            }}
                            title="New Note with Color"
                            style={{ cursor: 'pointer' }}
                        >
                            <FaPalette size={20} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="input-expanded" style={{ padding: '20px' }}>
                    {/* Header: Title & Priority */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <input
                            ref={titleRef}
                            value={title}
                            onChange={(e) => updateContent({ title: e.target.value })}
                            placeholder="Title"
                            style={{ fontWeight: 'bold', fontSize: '1.25rem' }}
                        />

                        {/* Priority UI */}
                        <div
                            style={{ display: 'flex', gap: '8px', padding: '5px', background: isPriorityOpen ? 'rgba(0,0,0,0.2)' : 'transparent', borderRadius: '20px', transition: 'all 0.2s', cursor: isPriorityOpen ? 'default' : 'pointer', minWidth: isPriorityOpen ? 'auto' : '24px', justifyContent: 'center' }}
                            onClick={() => !isPriorityOpen && setIsPriorityOpen(true)}
                        >
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(isPriorityOpen || priority === 'High') && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPriorityOpen) { setPriority('High'); setIsPriorityOpen(false); }
                                            else { setIsPriorityOpen(true); }
                                        }}
                                        title="High Priority"
                                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff5f56', boxShadow: priority === 'High' ? 'inset 0 0 0 2px rgba(0,0,0,0.3)' : 'none', cursor: 'pointer', flexShrink: 0 }}
                                    />
                                )}
                                {(isPriorityOpen || priority === 'Medium') && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPriorityOpen) { setPriority('Medium'); setIsPriorityOpen(false); }
                                            else { setIsPriorityOpen(true); }
                                        }}
                                        title="Medium Priority"
                                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffbd2e', boxShadow: priority === 'Medium' ? 'inset 0 0 0 2px rgba(0,0,0,0.3)' : 'none', cursor: 'pointer', flexShrink: 0 }}
                                    />
                                )}
                                {(isPriorityOpen || priority === 'Low') && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPriorityOpen) { setPriority('Low'); setIsPriorityOpen(false); }
                                            else { setIsPriorityOpen(true); }
                                        }}
                                        title="Low Priority"
                                        style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#27c93f', boxShadow: priority === 'Low' ? 'inset 0 0 0 2px rgba(0,0,0,0.3)' : 'none', cursor: 'pointer', flexShrink: 0 }}
                                    />
                                )}
                                {isPriorityOpen && (
                                    <div onClick={(e) => { e.stopPropagation(); setPriority(null); setIsPriorityOpen(false); }} title="Remove Priority" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', cursor: 'pointer', flexShrink: 0 }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Blocks */}
                    <div className="blocks-container" style={{ minHeight: '80px', maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden' }}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={blocks.map(b => b.localId)} strategy={verticalListSortingStrategy}>
                                {blocks.map((block, index) => (
                                    <SortableBlock
                                        key={block.localId}
                                        id={block.localId}
                                        block={block}
                                        index={index}
                                        readOnly={readOnly}
                                        isActive={activeBlockIndex === index}
                                        updateBlock={updateBlock}
                                        handleBlockKeyDown={handleBlockKeyDown}
                                        setActiveBlockIndex={setActiveBlockIndex}
                                        addBlocks={addBlocks}
                                        toggleBlockType={toggleBlockType}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Footer Toolbar (Colors, Image, Save) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                            <button className="icon-btn" onClick={() => setShowColorPicker(!showColorPicker)}><FaPalette size={18} /></button>
                            {showColorPicker && (
                                <div style={{ position: 'absolute', bottom: '110%', left: '0', background: '#2d333b', padding: '10px', borderRadius: '8px', display: 'flex', gap: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 10, flexWrap: 'wrap', width: '220px' }}>
                                    {colors.map((c, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: c.value || 'var(--note-bg-default)',
                                                cursor: 'pointer',
                                                border: color === c.value ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)',
                                                position: 'relative'
                                            }}
                                            title={c.name}
                                        >
                                            {c.value === '' && <span style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>/</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bgImage && (
                                <button className="icon-btn" onClick={() => setBgImage('')} title="Remove Background" style={{ color: '#ff6b6b' }}>
                                    <FaTrash size={16} />
                                </button>
                            )}

                            {/* Background Picker (Next to Color Picker) */}
                            <div style={{ position: 'relative' }}>
                                <button className="icon-btn" onClick={() => setShowImgInput(!showImgInput)} title="Backgrounds">
                                    <FaImage size={18} />
                                </button>
                                {showImgInput && (
                                    <div style={{ position: 'absolute', bottom: '110%', left: '0', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', display: 'flex', gap: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 60, flexWrap: 'wrap', width: '260px' }}>
                                        {/* Custom Upload Option */}
                                        <div
                                            onClick={() => document.getElementById('image-upload').click()}
                                            style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px dashed var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.7 }}
                                            title="Upload Image"
                                        >
                                            <FaImage size={16} />
                                        </div>

                                        {/* Presets */}
                                        {BACKGROUNDS.map(bg => (
                                            <div
                                                key={bg.id}
                                                onClick={() => { setBgImage(`preset:${bg.id}`); setShowImgInput(false); }}
                                                style={{ width: '40px', height: '40px', borderRadius: '8px', border: bgImage === `preset:${bg.id}` ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', fontSize: '1.2rem' }}
                                                title={bg.name}
                                            >
                                                {bg.icon}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={collapse} className="btn-glass">Close</button>
                            <button onClick={() => { saveNote(); collapse(); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaSave /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Input for Image Upload - Moved outside conditional so it works from collapsed state too */}
            <input
                id="image-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                            const res = await api.uploadImage(formData);
                            const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api/notes', '') : 'http://localhost:5000';
                            const fullUrl = `${baseUrl}${res.data.filePath}`;
                            setBgImage(fullUrl);
                            setShowImgInput(false);
                            setIsExpanded(true); // Ensure expanded if uploaded from collapsed
                        } catch (err) {
                            console.error("Upload failed", err);
                            alert("Failed to upload image.");
                        }
                    }
                }}
            />
        </div>
    );
};

export default BlockEditor;
