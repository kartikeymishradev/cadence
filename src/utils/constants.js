// ─── Colors ───
export const INK = '#1F3A34';
export const PAPER = '#EDEFEA';
export const PAPER_RAISED = '#F5F6F2';
export const GOLD = '#C9922B';
export const ROSE = '#B8583F';
export const SAGE = '#5F8467';
export const SLATE = '#33414A';
export const HAIRLINE = 'rgba(31,58,52,0.15)';

// ─── Fonts ───
export const FONT_VOICE = "'Libre Caslon Text', Georgia, serif";
export const FONT_SANS = "'IBM Plex Sans', -apple-system, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

// ─── Calendar ───
export const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

// ─── Day-status stamp styles ───
export const STATUS_STYLE = {
  study:   { label: 'STUDY',     bg: SAGE, fg: '#EFF5EE' },
  done:    { label: 'STUDY',     bg: SAGE, fg: '#EFF5EE' },
  partial: { label: 'PARTIAL',  bg: GOLD, fg: '#3A2A0A' },
  off:     { label: 'OFF',       bg: ROSE, fg: '#FBEDE9' },
  holiday: { label: 'HOLIDAY +', bg: GOLD, fg: '#3A2A0A' },
};

// ─── Enhanced Multi-Week LLM System Prompts ───
export const STUDY_SYS =
  'You are an intelligent weekly study scheduler. Parse the user\'s study plan (single-week OR multi-week/semester roadmap). ' +
  'Return ONLY strict JSON with no prose and no markdown code fences. ' +
  'JSON Schema: {' +
  '"title":"Overall plan title, e.g. Data Analyst Prep",' +
  '"isMultiWeek": boolean,' +
  '"phases":[{"name":"Phase name","startWeek":number,"endWeek":number,"checkpoint":"Phase milestone goal"}],' +
  '"weeks":[' +
  '  {' +
  '    "weekNumber": number,' +
  '    "title":"Week title or focus area",' +
  '    "tasks":[{"day":"Monday".."Sunday","title":"short task title, under 6 words","start":"HH:MM 24hr","duration":minutesNumber}]' +
  '  }' +
  '],' +
  '"clarifications":["short direct question if crucial information is missing, max 2"]' +
  '}. ' +
  'CRITICAL SCHEDULING RULES: ' +
  '1. If no specific start times or daily durations are given, SYNTHESIZE sensible evening study slots (e.g. 19:00 for 90 minutes across Mon, Tue, Wed, Thu, Fri, Sat). ' +
  '2. Distribute topics evenly across days for each week. Do NOT cluster everything on Monday. ' +
  '3. For single-week plans, set isMultiWeek=false, phases=[], and return exactly 1 week in the weeks array (weekNumber=1). ' +
  '4. Make smart assumptions for minor gaps rather than asking clarifications unless essential.';

export const GYM_SYS =
  'You are an intelligent workout and nutrition scheduler. Parse the user\'s gym/diet plan (single or multi-week). ' +
  'Return ONLY strict JSON with no prose and no markdown code fences. ' +
  'JSON Schema: {' +
  '"title":"Workout & Diet Plan",' +
  '"isMultiWeek": boolean,' +
  '"phases":[],' +
  '"weeks":[' +
  '  {' +
  '    "weekNumber": number,' +
  '    "title":"Week focus",' +
  '    "workouts":[{"day":"Monday".."Sunday","title":"short workout name","start":"HH:MM 24hr","duration":minutesNumber}],' +
  '"meals":[{"day":"Monday".."Sunday","time":"HH:MM 24hr or empty string","name":"meal name","calories":numberOrNull,"protein":gramsNumberOrNull}]' +
  '  }' +
  '],' +
  '"clarifications":["short question, max 2"]' +
  '}. ' +
  'If times are missing, synthesize sensible workout slots (e.g. 07:00 60min) and meal times (08:00, 13:00, 20:00).';
