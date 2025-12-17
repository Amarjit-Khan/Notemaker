import React from 'react';
import { MdLightbulbOutline, MdArchive, MdDeleteOutline, MdNotificationsNone, MdEdit } from 'react-icons/md';


const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
    const navItems = [
        { id: 'notes', label: 'Notes', icon: <MdLightbulbOutline /> },
        { id: 'reminders', label: 'Reminders', icon: <MdNotificationsNone /> },
        { id: 'edit', label: 'Edit Labels', icon: <MdEdit /> },
        { id: 'archive', label: 'Archive', icon: <MdArchive /> },
        { id: 'trash', label: 'Trash', icon: <MdDeleteOutline /> },
    ];

    return (
        <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
            {/* Brand removed, moved to Header */}

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <p>Shortcuts:</p>
                <p>Alt+N: New Note</p>
                <p>Ctrl+S: Save</p>
            </div>
        </div>
    );
};

export default Sidebar;
