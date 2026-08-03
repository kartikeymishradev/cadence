import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, LayoutGrid, Plus, Trash2, FileText, X } from 'lucide-react';
import CollegeOverviewModal from './CollegeOverviewModal';

export default function NotesVault({
  categories = [],
  schedule = {},
  taskStatuses = {},
  userNotes = [],
  onAddUserNote,
  onDeleteUserNote,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Add Note Modal
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCat, setNoteCat] = useState(categories[0]?.id || 'skill');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Extract all notes & task items across categories
  const realNotesList = useMemo(() => {
    const items = [];

    (categories || []).forEach((cat) => {
      const taskList = schedule[cat.id] || [];
      taskList.forEach((t, idx) => {
        const taskId = `${cat.id}-${idx}`;
        const st = taskStatuses[taskId] || {};
        const noteText = st.note || '';

        if (noteText.trim()) {
          items.push({
            id: taskId,
            title: t.title,
            content: noteText,
            cat: cat.label || cat.name || 'Category',
            catId: cat.id,
            color: cat.color || 'var(--sage)',
            day: (t.day || 'Wed').slice(0, 3),
            isCustom: false,
          });
        }
      });
    });

    // Custom user notes
    const customItems = (userNotes || []).map((n) => {
      const catObj = (categories || []).find((c) => c.id === n.catId);
      return {
        id: n.id,
        title: n.title,
        content: n.content,
        cat: n.catLabel || catObj?.label || 'General Note',
        catId: n.catId || 'skill',
        color: catObj?.color || 'var(--indigo)',
        day: n.createdAt || 'Today',
        tags: n.tags || [],
        isCustom: true,
      };
    });

    return [...customItems, ...items];
  }, [categories, schedule, taskStatuses, userNotes]);

  const allNotes = realNotesList;

  const cats = [
    { id: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ id: c.id, label: c.label, dot: c.color || 'var(--indigo)' })),
  ];

  const shown = allNotes.filter((n) => {
    const matchesCat = activeCat === 'all' || (n.catId && n.catId.toLowerCase() === activeCat.toLowerCase()) || n.cat.toLowerCase().includes(activeCat.toLowerCase());
    const matchesSearch =
      searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  const handleCopyAllNotes = () => {
    if (allNotes.length === 0) return;
    const compiled = allNotes
      .map((n) => `📌 [${n.day}] ${n.cat}: ${n.title}\n${n.content}`)
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(compiled);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const catObj = categories.find((c) => c.id === noteCat);
    const newNote = {
      id: `note_${Date.now()}`,
      title: noteTitle.trim(),
      catId: noteCat,
      catLabel: catObj?.label || noteCat,
      content: noteContent.trim(),
      tags: noteTags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isCustom: true,
    };

    if (onAddUserNote) onAddUserNote(newNote);

    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: 0 }}>
          Notes & Knowledge Vault
        </h2>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--indigo)',
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={12} /> Add Note
          </button>

          {categories.some((c) => c.id === 'college') && (
            <button
              onClick={() => setIsOverviewOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--paper-raised)',
                border: '1px solid var(--hairline)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--slate)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <LayoutGrid size={12} />
              College Overview
            </button>
          )}

          <button
            onClick={handleCopyAllNotes}
            disabled={allNotes.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--paper-raised)',
              border: '1px solid var(--hairline)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: allNotes.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: allNotes.length === 0 ? 0.5 : 1,
            }}
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />}
            {copiedAll ? 'Copied!' : 'Export All'}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          marginBottom: 10,
        }}
      >
        <Search size={14} color="var(--slate)" />
        <input
          type="text"
          placeholder="Search notes, subjects, or tags…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 12,
            width: '100%',
            color: 'var(--ink)',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {cats.map((c) => {
          const active = activeCat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              {c.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Notes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--slate)',
              background: 'var(--paper-raised)',
              borderRadius: 14,
              border: '1px dashed var(--hairline)',
              fontSize: 13,
            }}
          >
            <FileText size={24} style={{ marginBottom: 6, opacity: 0.5 }} />
            <div>No notes found matching your search. Click <strong>+ Add Note</strong> above to create your first note!</div>
          </div>
        ) : (
          shown.map((n) => (
            <div
              key={n.id}
              style={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--hairline)',
                borderRadius: 14,
                padding: '14px 16px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `1px solid ${n.color || 'var(--sage)'}`,
                      color: n.color || 'var(--sage)',
                    }}
                  >
                    {n.cat}
                  </span>
                  {n.isCustom && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo)', padding: '2px 6px', borderRadius: 4 }}>
                      📌 Custom Note
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                    {n.day}
                  </span>
                  {n.isCustom && onDeleteUserNote && (
                    <button
                      onClick={() => onDeleteUserNote(n.id)}
                      title="Delete Note"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--slate)',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{n.title}</h4>
              {n.content && <p style={{ margin: 0, fontSize: 13, color: 'var(--slate)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.content}</p>}

              {n.tags && n.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {n.tags.map((t, idx) => (
                    <span key={idx} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--paper)', padding: '2px 6px', borderRadius: 4, color: 'var(--slate)', border: '1px solid var(--hairline)' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10007,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--paper-raised)',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 460,
              border: '1px solid var(--hairline)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: 0 }}>Add New Note</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Note Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Load Balancing Notes"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={noteCat}
                  onChange={(e) => setNoteCat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Note Content / Key Takeaways</label>
                <textarea
                  rows={4}
                  placeholder="Write your study notes, formulas, code snippets, or key concepts here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Architecture, Exam"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--paper-raised)',
                    color: 'var(--ink)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--indigo)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CollegeOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        collegeSchedule={schedule.college || []}
        taskStatuses={taskStatuses}
      />
    </div>
  );
}
