import React from 'react';
import { MdCheckBox, MdCheckBoxOutlineBlank, MdPushPin, MdArchive, MdDeleteOutline, MdRestoreFromTrash, MdDeleteForever, MdUnarchive } from 'react-icons/md';
import api from '../services/api';
// import { getColorForTheme, getTextColorForTheme } from '../utils/themeColors'; // Removed as per request
import { getBackgroundComponent } from './NoteBackgrounds';

const NoteCard = ({ note, onAction, theme }) => {
    const isPresetBg = note.backgroundImage && note.backgroundImage.startsWith('preset:');
    const hasBgImage = !!note.backgroundImage && !isPresetBg;

    // Handlers
    const handleArchive = (e) => { e.stopPropagation(); onAction('archive', note); };
    const handleTrash = (e) => { e.stopPropagation(); onAction('trash', note); };
    const handleRestore = (e) => { e.stopPropagation(); onAction('restore', note); };
    const handleDeleteForever = (e) => { e.stopPropagation(); onAction('delete', note); };

    // Legacy Color Mapping
    // Maps old hardcoded hex values to new theme-adaptive CSS variables
    const legacyColorMap = {
        '#ffffff': 'var(--note-bg-default)',
        '#f28b82': 'var(--note-bg-red)',
        '#fbbc04': 'var(--note-bg-orange)',
        '#fff475': 'var(--note-bg-yellow)',
        '#ccff90': 'var(--note-bg-green)',
        '#a7ffeb': 'var(--note-bg-teal)',
        '#cbf0f8': 'var(--note-bg-blue)', // light blue mapping to blue
        '#aecbfa': 'var(--note-bg-darkblue)',
        '#d7aefb': 'var(--note-bg-purple)',
        '#fdcfe8': 'var(--note-bg-pink)',
        '#e6c9a8': 'var(--note-bg-brown)',
        '#e8eaed': 'var(--note-bg-gray)'
    };

    // Determine Colors
    // 1. Check if note.color exists.
    // 2. If it's in our legacy map, upgrade it to the CSS var.
    // 3. If it's a CSS var already, use it.
    // 4. If it's an unknown hex (custom?), keep it (might have contrast issues, but rare).
    // 5. Fallback to default.
    let effectiveBackgroundColor;
    if (note.color) {
        effectiveBackgroundColor = legacyColorMap[note.color] || note.color;
    } else {
        effectiveBackgroundColor = hasBgImage ? 'transparent' : 'var(--note-bg-default)';
    }

    // Text Color Logic:
    // With valid mapping, background adapts to theme, so 'inherit' text works perfectly (White on Dark, Black on Light).
    // Exception: Background Image -> Force white.
    const effectiveTextColor = hasBgImage ? '#fff' : 'inherit';

    const [isHovered, setIsHovered] = React.useState(false);

    const actionBtnStyle = {
        background: 'none',
        border: 'none',
        color: effectiveTextColor,
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        opacity: isHovered ? 1 : 0, // Show on hover
        width: '34px',
        height: '34px'
    };

    // Simple way to handle touch devices? For now let's assume interactions are primary mouse. 
    // If strict Keep clone, actions appear on hover.

    const [showPriorityMenu, setShowPriorityMenu] = React.useState(false);

    const handlePriorityClick = (e) => {
        e.stopPropagation(); // Prevent opening note
        setShowPriorityMenu(!showPriorityMenu);
    };

    const setPriority = (priority) => {
        onAction('update', note, { priority });
        setShowPriorityMenu(false);
    };

    return (
        <div className="note-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowPriorityMenu(false); }} // Close menu on leave
            onClick={() => !note.isTrashed && onAction('edit', note)}
            style={{
                backgroundColor: effectiveBackgroundColor,
                backgroundImage: hasBgImage ? `url(${note.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: effectiveTextColor,
                textShadow: hasBgImage ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
                cursor: note.isTrashed ? 'default' : 'pointer',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'visible', // Changed to visible for popup
                // border handled by css class
            }}>
            {note.isPinned && !note.isTrashed && <MdPushPin className="pin-icon" style={{ opacity: 1, color: 'var(--accent-color)' }} />}

            {/* Render Preset Background */}
            {isPresetBg && (
                (() => {
                    const BgComponent = getBackgroundComponent(note.backgroundImage);
                    return BgComponent ? <BgComponent /> : null;
                })()
            )}

            {/* Priority Indicator & Menu */}
            {!note.isTrashed && (note.priority || isHovered) && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                    <div
                        onClick={handlePriorityClick}
                        title="Set Priority"
                        style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: note.priority === 'High' ? '#ff5f56' : (note.priority === 'Medium' ? '#ffbd2e' : (note.priority === 'Low' ? '#2ecc71' : 'transparent')),
                            border: note.priority ? '1px solid rgba(0,0,0,0.1)' : '1px dashed var(--text-secondary)',
                            cursor: 'pointer',
                            opacity: note.priority ? 1 : 0.5,
                            transition: 'all 0.2s'
                        }}
                    />

                    {/* Priority Menu */}
                    {showPriorityMenu && (
                        <div style={{
                            position: 'absolute', top: '100%', right: '0', marginTop: '5px',
                            background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
                            border: '1px solid var(--glass-border)', borderRadius: '8px',
                            padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px',
                            boxShadow: 'var(--shadow-md)', minWidth: '80px', zIndex: 20
                        }} onClick={e => e.stopPropagation()}>
                            {['High', 'Medium', 'Low', null].map(p => (
                                <div key={p || 'None'}
                                    onClick={() => setPriority(p)}
                                    style={{
                                        padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                                        fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                                        color: 'var(--text-primary)', background: 'transparent'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: p === 'High' ? '#ff5f56' : (p === 'Medium' ? '#ffbd2e' : (p === 'Low' ? '#2ecc71' : 'transparent')),
                                        border: p ? 'none' : '1px solid var(--text-secondary)'
                                    }} />
                                    {p || 'None'}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Title */}
            <div style={{ padding: '12px 12px 0 12px' }}>
                {note.title && <h3 style={{ marginBottom: '12px', fontSize: '1.15rem', fontWeight: 600 }}>{note.title}</h3>}
            </div>

            {/* Content Preview (First 4 blocks) */}
            <div className="note-content" style={{ maxHeight: '300px', overflow: 'hidden', padding: '0 12px 12px 12px' }}>
                <div style={{ fontSize: '0.9rem', color: 'inherit', lineHeight: '1.5' }}>
                    {note.blocks ? note.blocks.slice(0, 4).map((block, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                            {block.type === 'todo' && (
                                <div style={{ marginRight: '8px', minWidth: '16px' }}>{block.isChecked ? '☑' : '☐'}</div>
                            )}
                            <div
                                className="note-preview-text"
                                style={{
                                    textDecoration: block.isChecked ? 'line-through' : 'none',
                                    fontWeight: block.type === 'h1' || block.type === 'h2' ? 'bold' : 'normal',
                                    fontSize: block.type === 'h1' ? '1.1rem' : block.type === 'h2' ? '1rem' : '0.9rem'
                                }}
                                dangerouslySetInnerHTML={{ __html: block.content || (block.type === 'text' ? 'Empty note' : '') }}
                            />
                        </div>
                    )) : (
                        <div>No content</div>
                    )}
                    {note.blocks && note.blocks.length > 4 && (
                        <div style={{ fontStyle: 'italic', opacity: 0.6, marginTop: '5px' }}>... +{note.blocks.length - 4} more</div>
                    )}
                </div>
            </div>

            {/* Actions Hover - Minimalist */}
            <div className="actions" style={{
                padding: '5px 10px',
                display: 'flex', justifyContent: 'flex-end', gap: '5px',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
                pointerEvents: isHovered ? 'auto' : 'none'
            }}>
                {note.isTrashed ? (
                    <>
                        <button onClick={handleRestore} title="Restore" className="note-action-btn" style={actionBtnStyle}><MdRestoreFromTrash size={18} /></button>
                        <button onClick={handleDeleteForever} title="Delete Forever" className="note-action-btn" style={actionBtnStyle}><MdDeleteForever size={18} /></button>
                    </>
                ) : (
                    <>
                        <button onClick={handleArchive} title={note.isArchived ? "Unarchive" : "Archive"} className="note-action-btn" style={actionBtnStyle}>
                            {note.isArchived ? <MdUnarchive size={18} /> : <MdArchive size={18} />}
                        </button>
                        <button onClick={handleTrash} title="Delete" className="note-action-btn" style={actionBtnStyle}><MdDeleteOutline size={18} /></button>
                    </>
                )}
            </div>
        </div>
    );
};

export default NoteCard;
