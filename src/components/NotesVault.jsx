import React, { useState, useMemo } from 'react';
import { FileText, Search, Copy, Check, Filter, BookOpen, GraduationCap, Dumbbell, Calendar, Sparkles } from 'lucide-react';
import { WEEKDAYS } from '../utils/constants';

export default function NotesVault({
  categories = [],
  schedule = {},
  taskStatuses = {},
  onUpdateTaskNote,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Extract all notes & task items across categories
  const allNotesList = useMemo(() => {
    const items = [];

    categories.forEach((cat) => {
      const taskList = schedule[cat.id] || [];
      taskList.forEach((t, idx) => {
        const taskId = `${cat.id}-${idx}`;
        const st = taskStatuses[taskId] || {};
        const noteText = st.note || '';

        items.push({
          id: taskId,
          title: t.title,
          day: t.day || 'Monday',
          start: t.start || '10:00',
          duration: t.duration || 60,
          category: cat,
          status: st.status || 'pending',
          note: noteText,
        });
      });
    });

    return items;
  }, [categories, schedule, taskStatuses]);

  // Filtered notes based on search & category selection
  const filteredNotes = useMemo(() => {
    return allNotesList.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category.id === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.day.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [allNotesList, selectedCategory, searchQuery]);

  const notesWithText = useMemo(() => {
    return filteredNotes.filter((n) => n.note.trim().length > 0);
  }, [filteredNotes]);

  const handleCopyAllNotes = () => {
    if (notesWithText.length === 0) return;
    const compiled = notesWithText
      .map(
        (n) =>
          `📌 [${n.day}] ${n.category.label}: ${n.title} (${n.start})\nNote: ${n.note}\n---`
      )
      .join('\n\n');

    navigator.clipboard.writeText(compiled);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSaveEdit = (id) => {
    if (onUpdateTaskNote) {
      onUpdateTaskNote(id, editText);
    }
    setEditingId(null);
  };

  const categoryIconMap = {
    skill: BookOpen,
    college: GraduationCap,
    gym: Dumbbell,
  };

  return (
    <div className="notes-vault cadence-card">
      {/* Header Banner */}
      <div className="notes-vault__header">
        <div className="notes-vault__title-group">
          <div className="notes-vault__icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="notes-vault__title">Notes & Class Archive</h2>
            <p className="notes-vault__subtitle">
              All your logged lecture notes, study summaries & assignment details in one place.
            </p>
          </div>
        </div>

        <button
          className="cadence-btn cadence-btn--primary notes-vault__export-btn"
          onClick={handleCopyAllNotes}
          disabled={notesWithText.length === 0}
        >
          {copiedAll ? <Check size={16} /> : <Copy size={16} />}
          <span>{copiedAll ? 'All Notes Copied!' : 'Copy All Monthly Notes'}</span>
        </button>
      </div>

      {/* Stats Summary Chips */}
      <div className="notes-vault__stats">
        <div className="vault-stat-chip">
          <Sparkles size={14} />
          <span><strong>{notesWithText.length}</strong> Notes Logged</span>
        </div>
        <div className="vault-stat-chip">
          <Calendar size={14} />
          <span><strong>{allNotesList.length}</strong> Total Classes & Sessions</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="notes-vault__controls">
        <div className="notes-vault__search">
          <Search size={16} className="notes-search-icon" />
          <input
            type="text"
            placeholder="Search notes, subjects, or days (e.g. React, Monday)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="notes-vault__category-pills">
          <button
            className={`cat-pill ${selectedCategory === 'all' ? 'cat-pill--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </button>

          {categories.map((cat) => {
            const IconComp = categoryIconMap[cat.id] || BookOpen;
            return (
              <button
                key={cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'cat-pill--active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-dot" style={{ background: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Timeline List */}
      <div className="notes-vault__list">
        {filteredNotes.length === 0 ? (
          <div className="notes-vault__empty">
            <FileText size={32} opacity={0.4} />
            <p>No class or task notes found matching your filter.</p>
            <span>Click the note icon on any task in Today or Week view to add lecture notes!</span>
          </div>
        ) : (
          filteredNotes.map((item) => {
            const isEditing = editingId === item.id;
            const IconComp = categoryIconMap[item.category.id] || BookOpen;

            return (
              <div key={item.id} className="vault-item-card">
                <div className="vault-item__top">
                  <div className="vault-item__tag" style={{ background: `${item.category.color}15`, color: item.category.color, borderColor: `${item.category.color}40` }}>
                    <IconComp size={13} />
                    <span>{item.category.label}</span>
                  </div>

                  <span className="vault-item__day-badge">{item.day} • {item.start}</span>

                  <span className={`vault-item__status-chip vault-item__status-chip--${item.status}`}>
                    {item.status === 'done' ? '✓ Completed' : item.status === 'partial' ? '- Partial' : 'Pending'}
                  </span>
                </div>

                <h4 className="vault-item__title">{item.title}</h4>

                {/* Note Content / Editor */}
                <div className="vault-item__note-container">
                  {isEditing ? (
                    <div className="vault-edit-box">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Type class notes, assignment details, or key takeaways..."
                      />
                      <div className="vault-edit-actions">
                        <button className="cadence-btn cadence-btn--sm cadence-btn--primary" onClick={() => handleSaveEdit(item.id)}>
                          Save Note
                        </button>
                        <button className="cadence-btn cadence-btn--sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="vault-note-display">
                      {item.note ? (
                        <p className="vault-note-text">{item.note}</p>
                      ) : (
                        <p className="vault-note-placeholder">No notes written for this class yet.</p>
                      )}
                      <button
                        className="vault-note-edit-btn"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditText(item.note);
                        }}
                      >
                        {item.note ? 'Edit Note' : '+ Add Note'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
