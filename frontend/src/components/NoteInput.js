import React, { useState, useRef, useEffect } from 'react';
import { FaCheckSquare, FaImage, FaPalette, FaSave } from 'react-icons/fa';
import { MdDragIndicator, MdCheckBoxOutlineBlank } from 'react-icons/md';
import api from '../services/api';

const NoteInput = ({ onNoteAdded }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteType, setNoteType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [listItems, setListItems] = useState([{ text: '', isCompleted: false, indent: 0 }]);
    const [priority, setPriority] = useState('Low');
    const [color, setColor] = useState('#ffffff');
    const [bgImage, setBgImage] = useState('');

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showImgInput, setShowImgInput] = useState(false);

    const containerRef = useRef(null);
    const titleInputRef = useRef(null);

    // Global Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Alt + N: New Note
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                setIsExpanded(true);
                setTimeout(() => titleInputRef.current?.focus(), 100);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Component Shortcuts
    const handleKeyDown = (e) => {
        // Ctrl + S: Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveNote();
            collapse();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Optional: Auto-save on blur if desired, currently user asked for explicit button mostly
                // keeping auto-close behavior but NOT auto-saving to force user to click save or shortcut?
                // Actually user said "The notes once written and closed are not saved... Give me a save note button"
                // Implicitly they might still want auto-save, but let's stick to explicit for now or auto-save if content exists.
                // Let's safe-guard: if clicked outside, we collapse. User requested "Save button", implying they want control.
                // But for UX, not losing data is better. I will auto-save if content exists.
                if (isExpanded) {
                    if (title || content || (noteType === 'list' && listItems.some(i => i.text))) {
                        saveNote();
                    }
                    collapse();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, title, content, listItems, priority, color, bgImage]);

    const collapse = () => {
        setIsExpanded(false);
        setTitle('');
        setContent('');
        setListItems([{ text: '', isCompleted: false, indent: 0 }]);
        setPriority('Low');
        setNoteType('text');
        setColor('#ffffff');
        setBgImage('');
        setShowColorPicker(false);
        setShowImgInput(false);
    };

    const saveNote = async () => {
        const finalItems = noteType === 'list' ? listItems.filter(i => i.text.trim()) : [];
        if (noteType === 'text' && !title.trim() && !content.trim()) return;
        if (noteType === 'list' && !title.trim() && finalItems.length === 0) return;

        const newNote = {
            title,
            type: noteType,
            content: noteType === 'text' ? content : '',
            listItems: finalItems,
            priority,
            color,
            backgroundImage: bgImage
        };

        try {
            await api.createNote(newNote);
            onNoteAdded();
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    const handleListItemKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.ctrlKey) {
                // Ctrl + Enter: Exit list / Save? 
                // Requirement: "if I press ctrl-enter I should go to the parest list to add a new list" -> Maybe exit to parent? 
                // User text: "if I press ctrl-enter I should go to the parest list to add a new list" 
                // Interpretation: maybe they mean outdent? Or create a new note? 
                // "Enter it gives me another sub-list... Ctrl-enter go to parent list"
                // I will interpret Ctrl+Enter to MEAN "Outdent" (go to parent level) if indented, or specific logic.
                // Actually, usually Enter = new item. Tab = Indent. Shift+Tab = Outdent.
                // Let's map Ctrl+Enter to "Save and Close" as per standard power user flow, OR strict interpretation.
                // "Ctrl-enter I should go to the parest list to add a new list" sounds like OUTDENT + NEW LINE.

                // Let's implement Outdent logic for Ctrl+Enter
                const newItems = [...listItems];
                if (newItems[index].indent > 0) {
                    newItems[index].indent -= 1;
                    setListItems(newItems);
                } else {
                    // Already at top, maybe finish note?
                    saveNote();
                    collapse();
                }
            } else {
                const newItems = [...listItems];
                newItems.splice(index + 1, 0, { text: '', isCompleted: false, indent: listItems[index].indent });
                setListItems(newItems);
            }
        } else if (e.key === 'Backspace' && !listItems[index].text && listItems.length > 1) {
            e.preventDefault();
            const newItems = [...listItems];
            newItems.splice(index, 1);
            setListItems(newItems);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const newItems = [...listItems];
            if (e.shiftKey) {
                newItems[index].indent = Math.max(0, newItems[index].indent - 1);
            } else {
                newItems[index].indent = Math.min(3, newItems[index].indent + 1);
            }
            setListItems(newItems);
        }
    };

    return (
        <div ref={containerRef} className="note-input-container glass-panel" onKeyDown={handleKeyDown} style={{
            backgroundColor: color !== '#ffffff' ? color : 'var(--glass-bg)',
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            backgroundSize: 'cover',
            position: 'relative'
        }}>
            {!isExpanded ? (
                <div style={{ display: 'flex', alignItems: 'center', padding: '15px' }} onClick={() => setIsExpanded(true)}>
                    <input
                        type="text"
                        placeholder="Take a note..."
                        style={{ fontWeight: 500, fontSize: '1rem', cursor: 'text' }}
                        readOnly
                    />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
                        <FaCheckSquare size={20} />
                        <FaImage size={20} />
                        <FaPalette size={20} />
                    </div>
                </div>
            ) : (
                <div className="input-expanded anim-expand" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <input
                            ref={titleInputRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                        />
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'inherit', borderRadius: '4px', padding: '4px' }}
                        >
                            <option value="Low">Priority: Low</option>
                            <option value="Medium">Priority: Medium</option>
                            <option value="High">Priority: High</option>
                        </select>
                    </div>

                    {noteType === 'text' ? (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Take a note..."
                            rows={4}
                            style={{ fontSize: '1rem', lineHeight: '1.5', minHeight: '60px' }}
                        />
                    ) : (
                        <div className="list-editor">
                            {listItems.map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', paddingLeft: `${item.indent * 24}px` }}>
                                    <MdDragIndicator size={16} style={{ cursor: 'move', opacity: 0.5, marginRight: '8px' }} />
                                    <MdCheckBoxOutlineBlank size={20} style={{ opacity: 0.7, marginRight: '8px' }} />
                                    <input
                                        value={item.text}
                                        onChange={(e) => {
                                            const newItems = [...listItems];
                                            newItems[index].text = e.target.value;
                                            setListItems(newItems);
                                        }}
                                        onKeyDown={(e) => handleListItemKeyDown(e, index)}
                                        placeholder="List item"
                                        autoFocus={index === listItems.length - 1}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                            ))}
                            <div
                                onClick={() => setListItems([...listItems, { text: '', isCompleted: false, indent: 0 }])}
                                style={{ display: 'flex', alignItems: 'center', marginTop: '10px', cursor: 'pointer', opacity: 0.7 }}
                            >
                                <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>+</span> List item
                            </div>
                        </div>
                    )}

                    {/* Tools Area */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                            <button className="icon-btn" onClick={() => setNoteType(noteType === 'text' ? 'list' : 'text')} title="Toggle List (Ctrl+L)">
                                <FaCheckSquare size={18} color={noteType === 'list' ? 'var(--accent-color)' : 'inherit'} />
                            </button>

                            <button className="icon-btn" onClick={() => setShowColorPicker(!showColorPicker)}><FaPalette size={18} /></button>
                            {showColorPicker && (
                                <div style={{ position: 'absolute', bottom: '100%', left: '0', background: '#333', padding: '10px', borderRadius: '8px', display: 'flex', gap: '5px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                                    {['#202124', '#5c2b29', '#614a19', '#1e3a5f', '#2d555e'].map(c => (
                                        <div key={c} onClick={() => { setColor(c); setShowColorPicker(false); }} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer', border: '1px solid #777' }} />
                                    ))}
                                    <div onClick={() => { setColor('#ffffff'); setShowColorPicker(false); }} style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', cursor: 'pointer' }} />
                                </div>
                            )}

                            <button className="icon-btn" onClick={() => setShowImgInput(!showImgInput)}><FaImage size={18} /></button>
                            {showImgInput && (
                                <div style={{ position: 'absolute', bottom: '100%', left: '50px', background: '#333', padding: '10px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', width: '250px' }}>
                                    <input
                                        placeholder="Image URL..."
                                        value={bgImage}
                                        onChange={(e) => setBgImage(e.target.value)}
                                        style={{ border: '1px solid #555', padding: '4px', borderRadius: '4px', fontSize: '0.8rem' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { saveNote(); collapse(); }} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Close
                            </button>
                            <button onClick={() => { saveNote(); collapse(); }} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaSave /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteInput;
