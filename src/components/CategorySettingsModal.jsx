import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, Tag } from 'lucide-react';

const PRESET_COLORS = ['#5F8467', '#C9922B', '#B8583F', '#33414A', '#4A6FA5', '#8E54E9', '#D946EF'];

export default function CategorySettingsModal({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
}) {
  const [catList, setCatList] = useState(categories);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const id = `cat_${Date.now()}`;
    const newCat = {
      id,
      label: newLabel.trim(),
      icon: 'Tag',
      color: newColor,
    };
    const updated = [...catList, newCat];
    setCatList(updated);
    setNewLabel('');
  };

  const handleDelete = (id) => {
    if (catList.length <= 1) return; // Keep at least one category
    const updated = catList.filter((c) => c.id !== id);
    setCatList(updated);
  };

  const handleSave = () => {
    onSaveCategories(catList);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} className="modal-icon" />
            <h3>Customize Categories</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Add custom plan tracks (e.g. <em>Skill Prep</em>, <em>College</em>, <em>Exam Revision</em>, <em>Fitness</em>) to organize your schedules independently:
          </p>

          {/* Existing Categories List */}
          <div className="cat-manage-list">
            {catList.map((cat) => (
              <div key={cat.id} className="cat-manage-item">
                <div className="cat-manage-item__left">
                  <span className="cat-color-dot" style={{ background: cat.color }} />
                  <span className="cat-manage-item__label">{cat.label}</span>
                </div>
                {catList.length > 1 && (
                  <button
                    className="cat-delete-btn"
                    onClick={() => handleDelete(cat.id)}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Category Form */}
          <div className="cat-add-form">
            <h4>Add New Category</h4>
            <div className="cat-add-row">
              <input
                type="text"
                className="cat-input"
                placeholder="Category Name (e.g. Side Project)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <div className="cat-color-picker">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    className={`color-pick-dot ${newColor === col ? 'color-pick-dot--active' : ''}`}
                    style={{ background: col }}
                    onClick={() => setNewColor(col)}
                  />
                ))}
              </div>
            </div>
            <button className="cadence-btn cat-add-btn" onClick={handleAdd} disabled={!newLabel.trim()}>
              <Plus size={14} />
              Add Category
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cadence-btn cadence-btn--primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
