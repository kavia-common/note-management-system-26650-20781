import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Utilities
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => Date.now();
const formatTime = (ts) => new Date(ts).toLocaleString();

// Sample placeholder data
const SAMPLE_NOTES = [
  {
    id: uid(),
    title: 'Welcome to Ocean Notes',
    content:
      "This is a minimalist note-taking app.\n\n- Create, edit, and delete notes\n- Responsive layout and smooth transitions\n- Ocean Professional theme with blue & amber accents\n\nTry creating a new note from the sidebar!",
    tags: ['welcome', 'info'],
    updatedAt: now() - 1000 * 60 * 60 * 2,
  },
  {
    id: uid(),
    title: 'Daily Tasks',
    content:
      "- Review PRs\n- Standup at 10:00\n- Plan sprint backlog\n\nTip: Use the search to quickly filter notes.",
    tags: ['tasks'],
    updatedAt: now() - 1000 * 60 * 30,
  },
  {
    id: uid(),
    title: 'Ideas',
    content:
      "• Explore a dark mode toggle\n• Add tag management\n• Persist to localStorage or backend",
    tags: ['ideas'],
    updatedAt: now() - 1000 * 10,
  },
];

// PUBLIC_INTERFACE
function App() {
  /** Root application with layout: Header, Sidebar, NotesList, Editor. */
  const [notes, setNotes] = useState(() => SAMPLE_NOTES);
  const [selectedId, setSelectedId] = useState(() => (SAMPLE_NOTES[0]?.id || null));
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme] = useState('light'); // reserved for future theme toggling

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.join(' ').toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, query]);

  // PUBLIC_INTERFACE
  const createNote = () => {
    /** Create a new note and select it. */
    const n = {
      id: uid(),
      title: 'Untitled',
      content: '',
      tags: [],
      updatedAt: now(),
    };
    setNotes((prev) => [n, ...prev]);
    setSelectedId(n.id);
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    /** Delete a note by id. */
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      // select next available note
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedId(remaining[0]?.id || null);
    }
  };

  // PUBLIC_INTERFACE
  const updateNote = (id, patch) => {
    /** Update a note with partial fields and refresh updatedAt. */
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n))
    );
  };

  const duplicateNote = (id) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const copy = {
      ...target,
      id: uid(),
      title: `${target.title} (Copy)`,
      updatedAt: now(),
    };
    setNotes((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
  };

  return (
    <div className="app-root">
      <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />
      <div className="layout">
        <Sidebar
          open={sidebarOpen}
          onNew={createNote}
          query={query}
          setQuery={setQuery}
        />
        <main className="main">
          <section className="panel notes-list-panel">
            <PanelHeader title="Notes" count={filteredNotes.length} />
            <NotesList
              notes={filteredNotes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={deleteNote}
              onDuplicate={duplicateNote}
            />
          </section>
          <section className="panel editor-panel">
            <PanelHeader title="Editor" />
            {selectedNote ? (
              <Editor
                note={selectedNote}
                onChangeTitle={(t) => updateNote(selectedNote.id, { title: t })}
                onChangeContent={(c) => updateNote(selectedNote.id, { content: c })}
                onChangeTags={(tags) => updateNote(selectedNote.id, { tags })}
                onDelete={() => deleteNote(selectedNote.id)}
              />
            ) : (
              <EmptyState onCreate={createNote} />
            )}
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function Header({ onToggleSidebar }) {
  return (
    <header className="header">
      <button className="icon-btn ghost" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="brand">
        <div className="logo-dot" />
        <span className="brand-title">Ocean Notes</span>
      </div>
      <div className="header-actions">
        <span className="badge">Modern</span>
      </div>
    </header>
  );
}

function Sidebar({ open, onNew, query, setQuery }) {
  return (
    <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
      <div className="sidebar-inner">
        <button className="btn primary w-full" onClick={onNew}>
          + New Note
        </button>
        <div className="search">
          <div className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            className="input"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <nav className="nav">
          <span className="nav-section">Filters</span>
          <button className="nav-item active">All</button>
          <button className="nav-item">Recent</button>
          <button className="nav-item">Tagged</button>
        </nav>
        <div className="sidebar-footer">
          <span className="muted">Local Mode</span>
        </div>
      </div>
    </aside>
  );
}

function PanelHeader({ title, count }) {
  return (
    <div className="panel-header">
      <h2 className="panel-title">
        {title}
        {typeof count === 'number' && <span className="count">{count}</span>}
      </h2>
      <div className="panel-actions" />
    </div>
  );
}

function NotesList({ notes, selectedId, onSelect, onDelete, onDuplicate }) {
  if (!notes.length) {
    return (
      <div className="empty">
        <p>No notes found.</p>
      </div>
    );
  }
  return (
    <ul className="notes-list">
      {notes.map((n) => (
        <li
          key={n.id}
          className={`note-item ${selectedId === n.id ? 'selected' : ''}`}
          onClick={() => onSelect(n.id)}
        >
          <div className="note-item-header">
            <h3 className="note-title">{n.title || 'Untitled'}</h3>
            <div className="note-actions" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" title="Duplicate" onClick={() => onDuplicate(n.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M8 8h11v11H8z" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 5h11v11" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <button className="icon-btn danger" title="Delete" onClick={() => onDelete(n.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <p className="note-snippet">{n.content?.slice(0, 120) || ''}{n.content?.length > 120 ? '…' : ''}</p>
          <div className="note-meta">
            <div className="tags">
              {(n.tags || []).slice(0, 3).map((t) => (
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>
            <span className="muted">{formatTime(n.updatedAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Editor({ note, onChangeTitle, onChangeContent, onChangeTags, onDelete }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (title !== note.title) onChangeTitle(title);
    }, 200);
    return () => clearTimeout(id);
  }, [title]); // eslint-disable-line

  useEffect(() => {
    const id = setTimeout(() => {
      if (content !== note.content) onChangeContent(content);
    }, 200);
    return () => clearTimeout(id);
  }, [content]); // eslint-disable-line

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const deduped = Array.from(new Set([...(note.tags || []), t]));
    onChangeTags(deduped);
    setTagInput('');
  };

  const removeTag = (t) => {
    onChangeTags((note.tags || []).filter((x) => x !== t));
  };

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <div className="left">
          <span className="muted">Last edited: {formatTime(note.updatedAt)}</span>
        </div>
        <div className="right">
          <button className="btn danger outline" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
      />
      <div className="tags-editor">
        <div className="tags">
          {(note.tags || []).map((t) => (
            <span className="tag interactive" key={t} onClick={() => removeTag(t)}>
              {t}
              <span className="x">×</span>
            </span>
          ))}
        </div>
        <div className="tag-input-wrap">
          <input
            className="input small"
            placeholder="Add tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag();
            }}
          />
          <button className="btn secondary small" onClick={addTag}>Add</button>
        </div>
      </div>
      <textarea
        className="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your note..."
      />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="empty full">
      <div className="empty-card">
        <div className="logo-dot large" />
        <h3>Start your first note</h3>
        <p className="muted">Click below to create a new note and begin writing.</p>
        <button className="btn primary" onClick={onCreate}>Create Note</button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span className="muted">Ocean Professional Theme</span>
      <span className="dot" />
      <span className="muted">No backend connected</span>
    </footer>
  );
}

export default App;
