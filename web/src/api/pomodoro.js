const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createApiClient = (baseURL) => {
  const client = {
    async request(url, options = {}) {
      const response = await fetch(`${baseURL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }));
        const errorMessage = errorData.message || `请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      return response.json();
    },

    get(url) {
      return this.request(url, { method: 'GET' });
    },

    post(url, body) {
      return this.request(url, { method: 'POST', body: JSON.stringify(body) });
    },

    put(url, body) {
      return this.request(url, { method: 'PUT', body: JSON.stringify(body) });
    },
  };

  return client;
};

const apiClient = createApiClient(API_BASE_URL);

export const pomodoroBasePath = API_BASE_URL;

export const DEFAULT_STATE = {
  phase: 'focus',
  mode: 'focus',
  modeLabel: '专注',
  status: 'idle',
  isRunning: false,
  remainingSeconds: 25 * 60,
  focusMinutes: 25,
  breakMinutes: 5,
  focusDurationSeconds: 25 * 60,
  breakDurationSeconds: 5 * 60,
  completedFocusSessions: 0,
  totalPhaseSeconds: 25 * 60,
  progress: 0,
};

export async function fetchPomodoroState() {
  return apiClient.get('/pomodoro');
}

export async function startPomodoro() {
  return apiClient.post('/pomodoro/start');
}

export async function pausePomodoro() {
  return apiClient.post('/pomodoro/pause');
}

export async function resumePomodoro() {
  return apiClient.post('/pomodoro/resume');
}

export async function resetPomodoro() {
  return apiClient.post('/pomodoro/reset');
}

export async function skipPomodoro() {
  return apiClient.post('/pomodoro/skip');
}

export async function updatePomodoroConfig(config) {
  return apiClient.put('/pomodoro/durations', config);
}
