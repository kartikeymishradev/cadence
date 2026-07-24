import React from 'react';
import { CheckCircle2, Utensils } from 'lucide-react';

export default function MealRow({ meal, logged, onToggle }) {
  if (!meal) return null;
  return (
    <div className="meal-row" onClick={() => onToggle(meal.id)}>
      <div className="meal-row__icon">
        {logged ? (
          <CheckCircle2 size={16} color="var(--sage)" />
        ) : (
          <Utensils size={15} color="var(--slate)" />
        )}
      </div>
      <span className="meal-row__time">{meal.time || '--:--'}</span>
      <span
        className={`meal-row__name ${logged ? 'meal-row__name--done' : ''}`}
      >
        {meal.name}
      </span>
      {meal.calories != null && (
        <span className="meal-row__badge">{meal.calories} cal</span>
      )}
      {meal.protein != null && (
        <span className="meal-row__badge">{meal.protein}g protein</span>
      )}
    </div>
  );
}
