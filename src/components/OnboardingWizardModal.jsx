import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight, Dumbbell, GraduationCap, BookOpen } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OnboardingWizardModal({
  isOpen,
  onClose,
  initialName = '',
  initialTheme = 'paper',
  initialSleep = { sleepStart: '23:30', sleepEnd: '07:00' },
  onSaveOnboarding,
}) {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState(initialName || '');
  const [selectedFocus, setSelectedFocus] = useState(['skill', 'college', 'gym']);
  const [restDays, setRestDays] = useState(['Sunday']);
  const [pomoPreset, setPomoPreset] = useState('25/5');
  const [selectedTheme, setSelectedTheme] = useState(initialTheme || 'paper');
  const [sleepTimes, setSleepTimes] = useState(initialSleep);

  if (!isOpen) return null;

  const toggleFocus = (id) => {
    setSelectedFocus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRestDay = (day) => {
    setRestDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  const handleFinish = () => {
    const finalData = {
      userName: userName.trim() || 'Friend',
      selectedFocus: selectedFocus.length > 0 ? selectedFocus : ['skill', 'college', 'gym'],
      restDays,
      pomoPreset,
      selectedTheme,
      sleepTimes,
    };

    if (onSaveOnboarding) {
      onSaveOnboarding(finalData);
    }

    localStorage.setItem('cadence_user_name', finalData.userName);
    localStorage.setItem('cadence_onboarded_v2', 'true');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--indigo)', fontWeight: 600 }}>
            STEP {step} OF 6
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <span
                key={s}
                style={{
                  width: s === step ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: s === step ? 'var(--indigo)' : 'var(--hairline)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Name */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-voice)', fontSize: 22, margin: 0 }}>
              Welcome to Dintaal! 👋
            </h2>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0, lineHeight: 1.45 }}>
              What should we call you? We'll personalize your daily rhythm dashboard.
            </p>
            <input
              type="text"
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--hairline)',
                fontSize: 14,
                fontFamily: 'inherit',
                background: 'var(--paper)',
                color: 'var(--ink)',
                marginTop: 4,
              }}
            />
          </div>
        )}

        {/* STEP 2: Primary Focus Areas */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: 0 }}>
              What is your primary focus? 🎯
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>
              Select the categories you want to track in your daily schedule:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[
                { id: 'skill', label: 'Career & Skills (Coding, Projects, Reading)', icon: BookOpen },
                { id: 'college', label: 'College & Classes (Lectures, Labs, Notes)', icon: GraduationCap },
                { id: 'gym', label: 'Gym & Fitness (Workouts, Meals, Macros)', icon: Dumbbell },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedFocus.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFocus(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? 'var(--indigo)' : 'var(--hairline)'}`,
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--paper)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} style={{ color: isSelected ? 'var(--indigo)' : 'var(--slate)' }} />
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>{item.label}</span>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--indigo)' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Preferred Rest Days */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: 0 }}>
              Select your rest days 🛋️
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>
              Which days of the week are typically off? Planned rest days won't penalize your streaks!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {WEEKDAYS.map((day) => {
                const isRest = restDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleRestDay(day)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: `1px solid ${isRest ? 'var(--rose)' : 'var(--hairline)'}`,
                      background: isRest ? 'rgba(239, 68, 68, 0.12)' : 'var(--paper)',
                      color: isRest ? 'var(--rose)' : 'var(--slate)',
                      fontSize: 12,
                      fontWeight: isRest ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {day} {isRest ? '✓ (Off)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Pomodoro Preset Preference */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: 0 }}>
              Pomodoro focus style ⏱️
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>
              Pick your default focus & break session length:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[
                { preset: '25/5', label: 'Classic (25m Focus / 5m Break)', desc: 'Best for steady, frequent focus intervals' },
                { preset: '50/10', label: 'Deep Focus (50m Focus / 10m Break)', desc: 'Great for coding sessions & complex study' },
                { preset: '90/15', label: 'Ultradran (90m Focus / 15m Break)', desc: 'For uninterrupted deep work blocks' },
              ].map((p) => {
                const isSelected = pomoPreset === p.preset;
                return (
                  <div
                    key={p.preset}
                    onClick={() => setPomoPreset(p.preset)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? 'var(--indigo)' : 'var(--hairline)'}`,
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--paper)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                      {isSelected && <Check size={16} style={{ color: 'var(--indigo)' }} />}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--slate)' }}>{p.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Theme Vibe */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: 0 }}>
              Choose your theme 🎨
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>
              Select a visual color palette (you can switch anytime from the top bar):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[
                { id: 'paper', label: 'Sage & Paper', color: '#5F8467', bg: '#EDEFEA' },
                { id: 'dark', label: 'Midnight Dark', color: '#60A5FA', bg: '#121816' },
                { id: 'nordic', label: 'Nordic Slate', color: '#3B82F6', bg: '#F1F5F9' },
                { id: 'matcha', label: 'Forest Matcha', color: '#4D7C0F', bg: '#F4F6F0' },
                { id: 'sunset', label: 'Warm Sunset', color: '#BE185D', bg: '#FDF4F5' },
              ].map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? 'var(--indigo)' : 'var(--hairline)'}`,
                      background: 'var(--paper)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.color }} />
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>{t.label}</span>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--indigo)' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Daily Sleep Rhythm */}
        {step === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-voice)', fontSize: 20, margin: 0 }}>
              Daily Sleep Rhythm 🌙
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: 0 }}>
              Set your target bedtime and wake-up time for smart late-night alerts:
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>BEDTIME</span>
                <input
                  type="time"
                  value={sleepTimes.sleepStart}
                  onChange={(e) => setSleepTimes((prev) => ({ ...prev, sleepStart: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>WAKE UP</span>
                <input
                  type="time"
                  value={sleepTimes.sleepEnd}
                  onChange={(e) => setSleepTimes((prev) => ({ ...prev, sleepEnd: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'transparent',
                fontSize: 12,
                cursor: 'pointer',
                color: 'var(--slate)',
              }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--indigo)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--sage)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Finish Setup <Sparkles size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
