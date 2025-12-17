import React, { useState, useEffect } from 'react';
import './index.css';
import BlockEditor from './components/BlockEditor';
import NoteList from './components/NoteList';
import Sidebar from './components/Sidebar';
import { FaSun, FaMoon } from 'react-icons/fa';
import { MdNotificationsNone, MdEdit } from 'react-icons/md';
import logo from './assets/logo.png';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

import Toast from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState('notes');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedNote, setSelectedNote] = useState(null);
  const [toast, setToast] = useState(null); // { message } or null

  const showToast = (message) => {
    setToast({ message });
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const handleNoteAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 300 }}
          >
            <Toast
              message={toast.message}
              onClose={() => setToast(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Header */}
      <header className="app-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Animated Hamburger */}
          <button
            className={`hamburger ${isSidebarOpen ? 'is-active' : ''}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <span className="hamburger-box">
              <span className="hamburger-inner"></span>
            </span>
          </button>

          {/* Brand Logo - Always Visible */}
          <div className="app-brand">
            <img src={logo} alt="Logo" />
            <span>Notemaker</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title="Toggle Theme"
          style={{ width: '40px', height: '40px' }} // Simple size fix, removed absolute pos
        >
          {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
      </header>

      {/* Sidebar - Below Header */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} />

      {/* Main Content */}
      <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
        <LayoutGroup>

          {/* Editor - Only in Notes view (New Note) */}
          {activeTab === 'notes' && (
            <motion.div layoutId="new-note-input">
              <BlockEditor onNoteAdded={handleNoteAdded} showToast={showToast} />
            </motion.div>
          )}

          {/* View Title if not notes (and not coming soon pages) */}
          {activeTab !== 'notes' && activeTab !== 'reminders' && activeTab !== 'edit' && (
            <h2 style={{ marginBottom: '20px', marginLeft: '10px', fontSize: '1.5rem', opacity: 0.8 }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          )}

          {/* Placeholder for Future Features */}
          {(activeTab === 'reminders' || activeTab === 'edit') && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh',
              color: 'var(--text-secondary)',
              marginTop: '40px'
            }}>
              <div style={{ fontSize: '5rem', opacity: 0.2, marginBottom: '20px' }}>
                {activeTab === 'reminders' ? <MdNotificationsNone /> : <MdEdit />}
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Coming in future</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>This feature is not yet implemented.</p>
            </div>
          )}

          {/* List - Only for Notes, Archive, Trash */}
          {(activeTab === 'notes' || activeTab === 'archive' || activeTab === 'trash') && (
            <NoteList
              status={activeTab}
              refreshTrigger={refreshTrigger}
              onUpdate={handleNoteAdded}
              onNoteClick={setSelectedNote}
            />
          )}

          {/* Edit Modal - REMOVED layoutId for reliability */}
          <AnimatePresence>
            {selectedNote && (
              <motion.div
                className="modal-overlay"
                onClick={() => setSelectedNote(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', maxWidth: '650px', position: 'relative', zIndex: 1001 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <BlockEditor
                    initialNote={selectedNote}
                    onNoteAdded={() => { setSelectedNote(null); handleNoteAdded(); }}
                    onClose={() => setSelectedNote(null)}
                    showToast={showToast}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </LayoutGroup>
      </main>
    </div>
  );
}

export default App;
