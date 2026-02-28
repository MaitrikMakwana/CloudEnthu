import { useState, useEffect } from 'react';

export default function Dashboard({ onLogout }) {
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(null); // null = All Weeks
    const [weekNames, setWeekNames] = useState({});

    // Controlled inputs for the active editor
    const [editorTitle, setEditorTitle] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [editorTags, setEditorTags] = useState('');

    const getToken = () => localStorage.getItem('admin_token');

    useEffect(() => {
        fetchNotes();
        fetchWeeks();
    }, []);

    const fetchWeeks = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/weeks`);
            if (res.ok) {
                const data = await res.json();
                const map = {};
                data.forEach(w => map[w.number] = w.name);
                setWeekNames(map);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
                if (data.length > 0 && !activeNoteId) {
                    setActiveNote(data[0]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const setActiveNote = (note) => {
        setActiveNoteId(note.id);
        setEditorTitle(note.title);
        setEditorContent(note.content || '');
        setEditorTags((note.tags || []).join(', '));
    };

    const handleCreateNew = async () => {
        const weekForNew = selectedWeek || 1;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    title: 'New Untitled Note',
                    content: '',
                    weekNumber: weekForNew,
                    tags: [],
                    status: 'DRAFT'
                })
            });
            if (res.ok) {
                const newNote = await res.json();
                setNotes(prev => [newNote, ...prev]);
                setActiveNote(newNote);
                // If a week is selected, keep it; otherwise switch to the new note's week
                if (selectedWeek && selectedWeek !== weekForNew) {
                    setSelectedWeek(weekForNew);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (statusOverride = null) => {
        const noteToSave = notes.find(n => n.id === activeNoteId);
        if (!noteToSave) return;

        const updatedStatus = statusOverride || noteToSave.status;
        const tagsArray = editorTags.split(',').map(t => t.trim()).filter(Boolean);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${activeNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    title: editorTitle,
                    content: editorContent,
                    weekNumber: noteToSave.weekNumber,
                    tags: tagsArray,
                    status: updatedStatus
                })
            });

            if (res.ok) {
                const updatedNote = await res.json();
                setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
                if (statusOverride === 'PUBLISHED') {
                    alert('Successfully Published!');
                }
            }
        } catch (error) {
            console.error('Failed to save', error);
        }
    };

    const handleDelete = async () => {
        if (!activeNoteId) return;
        if (!window.confirm('Are you sure you want to delete this note? This cannot be undone.')) return;

        const idToDelete = activeNoteId;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (res.ok) {
                const remaining = notes.filter(n => n.id !== idToDelete);
                setNotes(remaining);
                if (remaining.length > 0) {
                    setActiveNote(remaining[0]);
                } else {
                    setActiveNoteId(null);
                    setEditorTitle('');
                    setEditorContent('');
                    setEditorTags('');
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to delete note: ${errData.error || `Server returned ${res.status}`}`);
            }
        } catch (error) {
            console.error('Failed to delete', error);
            alert('Failed to delete note. Please check your connection and try again.');
        }
    };

    const handleRenameWeek = async (weekNum) => {
        const currentName = weekNames[weekNum] || `Week ${weekNum}`;
        const newName = window.prompt(`Rename Week ${weekNum}:`, currentName);
        if (!newName || newName === currentName) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/weeks/${weekNum}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) {
                setWeekNames(prev => ({ ...prev, [weekNum]: newName }));
            } else {
                alert('Failed to rename week.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Derived data ---
    const activeNote = notes.find(n => n.id === activeNoteId);

    // Unique sorted week numbers from real data, injected with currently selected week if empty
    const uniqueWeeksSet = new Set(notes.map(n => n.weekNumber).filter(Boolean));
    if (selectedWeek !== null) uniqueWeeksSet.add(selectedWeek);
    const uniqueWeeks = [...uniqueWeeksSet].sort((a, b) => a - b);

    // Unique tags from real data
    const uniqueTags = [...new Set(notes.flatMap(n => n.tags || []))].sort();

    // Notes filtered by search
    const searchFilteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Notes filtered by selected week (on top of search)
    const visibleNotes = selectedWeek === null
        ? searchFilteredNotes
        : searchFilteredNotes.filter(n => n.weekNumber === selectedWeek);

    // Group visible notes by week (for the "All Weeks" grouped view)
    const groupedByWeek = uniqueWeeks
        .map(week => ({
            week,
            notes: visibleNotes.filter(n => n.weekNumber === week)
        }))
        .filter(g => g.notes.length > 0);

    // Notes with no week number
    const ungroupedNotes = visibleNotes.filter(n => !n.weekNumber);

    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <aside className="sidebar neobrutalism-box">
                <div className="sidebar-header">
                    <h2 className="logo-text" style={{ fontSize: '1.4rem' }}>CloudEnthu</h2>
                </div>

                <div className="sidebar-content">
                    <button
                        onClick={handleCreateNew}
                        className="neobrutalism-btn pink full-width"
                        style={{ marginBottom: '20px' }}
                        title={selectedWeek ? `Create note in Week ${selectedWeek}` : 'Create new note'}
                    >
                        + New Note{selectedWeek ? ` (Wk ${selectedWeek})` : ''}
                    </button>

                    <div className="sidebar-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>By Week</h3>
                            <button
                                onClick={() => {
                                    const nextWeek = uniqueWeeks.length > 0 ? Math.max(...uniqueWeeks) + 1 : 1;
                                    const wk = window.prompt('Enter week number:', nextWeek);
                                    if (wk && !isNaN(parseInt(wk))) {
                                        setSelectedWeek(parseInt(wk));
                                    }
                                }}
                                className="neobrutalism-btn secondary small"
                                style={{ padding: '2px 8px', fontSize: '0.75rem', border: '2px solid #000' }}
                            >
                                + Add Week
                            </button>
                        </div>
                        <ul className="sidebar-list">
                            <li
                                className={selectedWeek === null ? 'active' : ''}
                                onClick={() => setSelectedWeek(null)}
                            >
                                <span>All Weeks</span>
                                <span className="week-count">{notes.length}</span>
                            </li>
                            {uniqueWeeks.map(week => {
                                const count = notes.filter(n => n.weekNumber === week).length;
                                return (
                                    <li
                                        key={week}
                                        className={selectedWeek === week ? 'active' : ''}
                                        onClick={() => setSelectedWeek(week)}
                                    >
                                        <span>{weekNames[week] || `Week ${week}`}</span>
                                        <span className="week-count">{count}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {uniqueTags.length > 0 && (
                        <div className="sidebar-section">
                            <h3>Tags</h3>
                            <div className="tag-cloud">
                                {uniqueTags.map(tag => (
                                    <span key={tag} className="pill small">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="neobrutalism-btn secondary full-width" style={{ fontSize: '0.9rem', padding: '8px' }}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* NOTE LIST */}
            <section className="note-list-pane neobrutalism-box">
                <div className="pane-header">
                    <div className="pane-header-title">
                        {selectedWeek !== null ? (
                            <span className="week-label" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>{weekNames[selectedWeek] || `Week ${selectedWeek}`}</span>
                                <button onClick={() => handleRenameWeek(selectedWeek)} className="pill small" style={{ cursor: 'pointer', padding: '2px 8px', fontSize: '0.7rem' }}>✏️ Rename</button>
                            </span>
                        ) : (
                            <span className="week-label">All Notes</span>
                        )}
                    </div>
                    <input
                        type="text"
                        className="neobrutalism-input"
                        style={{ padding: '10px', marginTop: '10px' }}
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="note-list-scrollable">
                    {isLoading && <p style={{ fontWeight: 600 }}>Loading...</p>}

                    {!isLoading && visibleNotes.length === 0 && (
                        <p style={{ fontWeight: 600, color: '#666' }}>No notes found.</p>
                    )}

                    {/* GROUPED VIEW — shown when All Weeks is selected */}
                    {!isLoading && selectedWeek === null && (
                        <>
                            {groupedByWeek.map(group => (
                                <div key={group.week} className="week-group">
                                    <div
                                        className="week-group-header"
                                        onClick={() => setSelectedWeek(group.week)}
                                        title={`Click to filter by ${weekNames[group.week] || `Week ${group.week}`}`}
                                    >
                                        <span>📅 {weekNames[group.week] || `Week ${group.week}`}</span>
                                        <span className="week-group-count">{group.notes.length} note{group.notes.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {group.notes.map(note => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isActive={activeNoteId === note.id}
                                            onClick={() => setActiveNote(note)}
                                        />
                                    ))}
                                </div>
                            ))}
                            {/* Notes with no week assigned */}
                            {ungroupedNotes.length > 0 && (
                                <div className="week-group">
                                    <div className="week-group-header">
                                        <span>📄 Uncategorized</span>
                                        <span className="week-group-count">{ungroupedNotes.length}</span>
                                    </div>
                                    {ungroupedNotes.map(note => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isActive={activeNoteId === note.id}
                                            onClick={() => setActiveNote(note)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* FLAT VIEW — shown when a specific week is selected */}
                    {!isLoading && selectedWeek !== null && visibleNotes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            isActive={activeNoteId === note.id}
                            onClick={() => setActiveNote(note)}
                        />
                    ))}
                </div>
            </section>

            {/* EDITOR */}
            <main className="editor-pane neobrutalism-box">
                {isLoading ? (
                    <div className="empty-editor" style={{ padding: '40px', fontWeight: 'bold' }}>Loading notes...</div>
                ) : activeNote ? (
                    <>
                        <div className="editor-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                <input
                                    type="text"
                                    className="editor-title-input"
                                    style={{ flex: 1, minWidth: '250px' }}
                                    value={editorTitle}
                                    onChange={(e) => setEditorTitle(e.target.value)}
                                />
                                <div className="editor-actions">
                                    {activeNote.status === 'PUBLISHED' ? (
                                        <span className="pill green">Live Blog</span>
                                    ) : (
                                        <span className="pill pink">Draft</span>
                                    )}
                                    <span className="pill" style={{ background: '#f8f8f8' }}>Week {activeNote.weekNumber}</span>

                                    <button onClick={() => handleSave()} className="neobrutalism-btn primary small">Save</button>

                                    {activeNote.status === 'DRAFT' && (
                                        <button onClick={() => handleSave('PUBLISHED')} className="neobrutalism-btn yellow small">Publish</button>
                                    )}
                                    {activeNote.status === 'PUBLISHED' && (
                                        <button className="neobrutalism-btn secondary small" onClick={(e) => {
                                            e.preventDefault();
                                            alert(`Link: cloudenthu.com/blog/${activeNote.slug}`)
                                        }}>Share</button>
                                    )}
                                    <button onClick={handleDelete} className="neobrutalism-btn secondary small" style={{ borderColor: '#e00', color: '#e00' }}>Delete</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#555' }}>Tags:</span>
                                <input
                                    type="text"
                                    className="neobrutalism-input"
                                    style={{ flex: 1, padding: '6px 12px', fontSize: '0.9rem' }}
                                    placeholder="Comma separated (e.g., aws, s3, iam)"
                                    value={editorTags}
                                    onChange={(e) => setEditorTags(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="editor-body">
                            <textarea
                                className="editor-textarea"
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                                placeholder="Start typing your markdown..."
                            />
                        </div>
                    </>
                ) : (
                    <div className="empty-editor" style={{ padding: '40px', fontWeight: 'bold' }}>
                        Select a note or create a new one.
                    </div>
                )}
            </main>
        </div>
    );
}

// Extracted note card component for reuse
function NoteCard({ note, isActive, onClick }) {
    return (
        <div
            className={`note-card neobrutalism-box ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            <h4>{note.title}</h4>
            <p className="note-snippet">{note.content ? note.content.substring(0, 60) : '—'}...</p>
            <div className="note-meta">
                <span className={`note-status-badge ${note.status === 'PUBLISHED' ? 'live' : 'draft'}`}>
                    {note.status === 'PUBLISHED' ? '🟢 LIVE' : '⚪ DRAFT'}
                </span>
                <div className="note-tags">
                    {(note.tags || []).map(t => <span key={t} className="tiny-pill">#{t}</span>)}
                </div>
            </div>
        </div>
    );
}
