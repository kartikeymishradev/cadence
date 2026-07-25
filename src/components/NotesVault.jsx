import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function NotesVault({
  categories = [],
  schedule = {},
  taskStatuses = {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const DEMO_NOTES = [
    { id: 'n1', title: 'React Hooks — useEffect cleanup', cat: 'Skill Prep', color: 'var(--sage)', day: 'Wed' },
    { id: 'n2', title: 'DBMS — Normalization forms', cat: 'College', color: 'var(--indigo)', day: 'Thu' },
    { id: 'n3', title: 'Push day — form notes', cat: 'Gym & Diet', color: 'var(--gold)', day: 'Fri' },
  ];

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
            title: `${t.title} — ${noteText}`,
            cat: cat.label || cat.name || 'Category',
            color: cat.color || 'var(--sage)',
            day: (t.day || 'Wed').slice(0, 3),
          });
        }
      });
    });

    return items;
  }, [categories, schedule, taskStatuses]);

  const allNotes = realNotesList.length > 0 ? realNotesList : DEMO_NOTES;

  const cats = [
    { id: 'all', label: 'All Categories' },
    { id: 'Skill Prep', label: 'Skill Prep', dot: 'var(--sage)' },
    { id: 'College', label: 'College', dot: 'var(--indigo)' },
    { id: 'Gym & Diet', label: 'Gym & Diet', dot: 'var(--gold)' },
  ];

  const shown = allNotes.filter((n) => {
    const matchesCat = activeCat === 'all' || n.cat.toLowerCase().includes(activeCat.toLowerCase());
    const matchesSearch = searchQuery.trim() === '' || n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: '4px 0 18px' }}>
      <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 18, margin: '0 0 12px' }}>
        Notes & Class Archive
      </h2>

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
          placeholder="Search notes, subjects, or days…"
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map((n) => (
          <div
            key={n.id}
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--hairline)',
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', marginLeft: 'auto' }}>
                {n.day}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13 }}>{n.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
