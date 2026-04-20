// Frontend assumes these endpoints exist:
// GET /api/pomodoro
// POST /api/pomodoro/start | /pause | /reset | /skip
// PUT /api/pomodoro/config
const DEFAULT_STATE = {
  mode: 'focus',
  isRunning: false,
  remainingSeconds: 25 * 60,
  focusMinutes: 25,
  breakMinutes: 5,
  completedFocusSessions: 0,
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/$/, '') : '';
const pomodoroBasePath = `${baseUrl}/api`;

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSource(payload) {
  if (payload && typeof payload === 'object') {
    if (payload.data && typeof payload.data === 'object') {
      return payload.data;
    }

    if (payload.state && typeof payload.state === 'object') {
      return payload.state;
    }
  }

  return payload ?? {};
}

export function normalizePomodoroState(payload) {
  const source = normalizeSource(payload);
  const settings = source.settings && typeof source.settings === 'object' ? source.settings : {};

  const mode = source.mode ?? source.phase ?? DEFAULT_STATE.mode;
  const focusMinutes = toNumber(
    source.focusMinutes ?? source.focusDurationMinutes ?? settings.focusMinutes,
    DEFAULT_STATE.focusMinutes,
  );
  const breakMinutes = toNumber(
    source.breakMinutes ?? source.breakDurationMinutes ?? settings.breakMinutes,
    DEFAULT_STATE.breakMinutes,
  );
  const remainingSeconds = Math.max(
    0,
    Math.floor(
      toNumber(
        source.remainingSeconds ??
          source.remainingTimeSeconds ??
          source.secondsLeft ??
          source.remaining ??
          source.timeLeft,
        mode === 'break' ? breakMinutes * 60 : focusMinutes * 60,
      ),
    ),
  );

  return {
    mode: mode === 'break' ? 'break' : 'focus',
    status: source.status ?? (source.isRunning ? 'running' : 'idle'),
    isRunning: Boolean(source.isRunning ?? source.running ?? source.active),
    remainingSeconds,
    focusMinutes,
    breakMinutes,
    completedFocusSessions: Math.max(
      0,
      Math.floor(
        toNumber(
          source.completedFocusSessions ??
            source.completedPomodoros ??
            source.completedCount ??
            source.focusSessionsCompleted,
          DEFAULT_STATE.completedFocusSessions,
        ),
      ),
    ),
  };
}

async function request(path = '', options = {}) {
  const response = await fetch(`${pomodoroBasePath}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;

    try {
      const errorPayload = await response.json();
      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch {
      // Ignore invalid JSON errors and keep the generic message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function fetchPomodoroState() {
  const payload = await request('/pomodoro');
  return normalizePomodoroState(payload);
}

export async function startPomodoro() {
  const payload = await request('/pomodoro/start', { method: 'POST' });
  return payload ? normalizePomodoroState(payload) : null;
}

export async function pausePomodoro() {
  const payload = await request('/pomodoro/pause', { method: 'POST' });
  return payload ? normalizePomodoroState(payload) : null;
}

export async function resumePomodoro() {
  const payload = await request('/pomodoro/resume', { method: 'POST' });
  return payload ? normalizePomodoroState(payload) : null;
}

export async function resetPomodoro() {
  const payload = await request('/pomodoro/reset', { method: 'POST' });
  return payload ? normalizePomodoroState(payload) : null;
}

export async function skipPomodoro() {
  const payload = await request('/pomodoro/skip', { method: 'POST' });
  return payload ? normalizePomodoroState(payload) : null;
}

export async function updatePomodoroConfig({ focusMinutes, breakMinutes }) {
  const payload = await request('/pomodoro/durations', {
    method: 'PUT',
    body: JSON.stringify({
      focusMinutes,
      breakMinutes,
    }),
  });

  return payload ? normalizePomodoroState(payload) : null;
}

export { DEFAULT_STATE, pomodoroBasePath };
