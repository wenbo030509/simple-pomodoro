import { useEffect, useReducer } from 'react';
import {
  DEFAULT_STATE,
  fetchPomodoroState,
  pausePomodoro,
  pomodoroBasePath,
  resetPomodoro,
  resumePomodoro,
  skipPomodoro,
  startPomodoro,
  updatePomodoroConfig,
} from './api/pomodoro.js';

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getModeMeta(mode) {
  return mode === 'break'
    ? {
        label: '休息中',
        hint: '喝口水，活动一下，下一轮会更稳。',
      }
    : {
        label: '专注中',
        hint: '把注意力留给一件最重要的事。',
      };
}

const initialState = {
  pomodoro: DEFAULT_STATE,
  draftSettings: {
    focusMinutes: DEFAULT_STATE.focusMinutes,
    breakMinutes: DEFAULT_STATE.breakMinutes,
  },
  isBootstrapping: true,
  isSavingConfig: false,
  activeAction: '',
  error: '',
};

function pomodoroReducer(state, action) {
  switch (action.type) {
    case 'SET_POMODORO':
      return { ...state, pomodoro: action.payload };
    case 'SET_DRAFT_SETTINGS':
      return { ...state, draftSettings: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: '' };
    case 'SET_BOOTSTRAPPING':
      return { ...state, isBootstrapping: action.payload };
    case 'SET_SAVING_CONFIG':
      return { ...state, isSavingConfig: action.payload };
    case 'SET_ACTIVE_ACTION':
      return { ...state, activeAction: action.payload };
    case 'UPDATE_DRAFT_FOCUS':
      return {
        ...state,
        draftSettings: { ...state.draftSettings, focusMinutes: action.payload },
      };
    case 'UPDATE_DRAFT_BREAK':
      return {
        ...state,
        draftSettings: { ...state.draftSettings, breakMinutes: action.payload },
      };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(pomodoroReducer, initialState);

  async function syncState() {
    const pomodoroState = await fetchPomodoroState();
    dispatch({ type: 'SET_POMODORO', payload: pomodoroState });
    dispatch({
      type: 'SET_DRAFT_SETTINGS',
      payload: {
        focusMinutes: pomodoroState.focusMinutes,
        breakMinutes: pomodoroState.breakMinutes,
      },
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const pomodoroState = await fetchPomodoroState();
        if (cancelled) {
          return;
        }

        dispatch({ type: 'SET_POMODORO', payload: pomodoroState });
        dispatch({
          type: 'SET_DRAFT_SETTINGS',
          payload: {
            focusMinutes: pomodoroState.focusMinutes,
            breakMinutes: pomodoroState.breakMinutes,
          },
        });
        dispatch({ type: 'CLEAR_ERROR' });
      } catch (bootstrapError) {
        if (!cancelled) {
          dispatch({ type: 'SET_ERROR', payload: bootstrapError.message });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: 'SET_BOOTSTRAPPING', payload: false });
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.isBootstrapping) {
      return undefined;
    }

    let disposed = false;
    const interval = window.setInterval(async () => {
      try {
        const pomodoroState = await fetchPomodoroState();
        if (!disposed) {
          dispatch({ type: 'SET_POMODORO', payload: pomodoroState });
          dispatch({ type: 'CLEAR_ERROR' });
        }
      } catch (pollError) {
        if (!disposed) {
          dispatch({ type: 'SET_ERROR', payload: pollError.message });
        }
      }
    }, state.pomodoro.isRunning ? 1000 : 10000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [state.isBootstrapping, state.pomodoro.isRunning]);

  async function runAction(actionName, action) {
    dispatch({ type: 'SET_ACTIVE_ACTION', payload: actionName });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const nextState = await action();

      if (nextState) {
        dispatch({ type: 'SET_POMODORO', payload: nextState });
        dispatch({
          type: 'SET_DRAFT_SETTINGS',
          payload: {
            focusMinutes: nextState.focusMinutes,
            breakMinutes: nextState.breakMinutes,
          },
        });
      } else {
        await syncState();
      }
    } catch (actionError) {
      dispatch({ type: 'SET_ERROR', payload: actionError.message });
    } finally {
      dispatch({ type: 'SET_ACTIVE_ACTION', payload: '' });
    }
  }

  async function handleSaveConfig() {
    const focusMinutes = Number(state.draftSettings.focusMinutes);
    const breakMinutes = Number(state.draftSettings.breakMinutes);

    if (!Number.isFinite(focusMinutes) || !Number.isFinite(breakMinutes)) {
      dispatch({ type: 'SET_ERROR', payload: '请输入有效的分钟数。' });
      return;
    }

    dispatch({ type: 'SET_SAVING_CONFIG', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const nextState = await updatePomodoroConfig({
        focusMinutes,
        breakMinutes,
      });

      if (nextState) {
        dispatch({ type: 'SET_POMODORO', payload: nextState });
        dispatch({
          type: 'SET_DRAFT_SETTINGS',
          payload: {
            focusMinutes: nextState.focusMinutes,
            breakMinutes: nextState.breakMinutes,
          },
        });
      } else {
        await syncState();
      }
    } catch (configError) {
      dispatch({ type: 'SET_ERROR', payload: configError.message });
    } finally {
      dispatch({ type: 'SET_SAVING_CONFIG', payload: false });
    }
  }

  const modeMeta = getModeMeta(state.pomodoro.mode);
  const isActionBusy = state.activeAction !== '';
  const hasValidSettings =
    Number(state.draftSettings.focusMinutes) >= 1 &&
    Number(state.draftSettings.focusMinutes) <= 180 &&
    Number(state.draftSettings.breakMinutes) >= 1 &&
    Number(state.draftSettings.breakMinutes) <= 60;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className={`status-pill ${state.pomodoro.mode}`}>
          <span className="status-dot" />
          {modeMeta.label}
        </div>

        <h1 className="hero-title">番茄钟 MVP</h1>
        <p className="hero-subtitle">{modeMeta.hint}</p>

        <div className="timer-panel">
          <div className="timer-face">{formatTime(state.pomodoro.remainingSeconds)}</div>
          <div className="timer-caption">
            {state.pomodoro.isRunning ? '当前正在倒计时' : '当前已暂停，随时可以继续'}
          </div>
        </div>

        <div className="action-grid">
          <button
            className="primary-button"
            disabled={state.isBootstrapping || isActionBusy || state.pomodoro.isRunning}
            onClick={() => runAction('start', startPomodoro)}
            type="button"
          >
            {state.activeAction === 'start' ? '启动中...' : '开始'}
          </button>

          <button
            className="secondary-button"
            disabled={state.isBootstrapping || isActionBusy || !state.pomodoro.isRunning}
            onClick={() => runAction('pause', pausePomodoro)}
            type="button"
          >
            {state.activeAction === 'pause' ? '暂停中...' : '暂停'}
          </button>

          <button
            className="secondary-button"
            disabled={state.isBootstrapping || isActionBusy || state.pomodoro.isRunning || state.pomodoro.status === 'idle'}
            onClick={() => runAction('resume', resumePomodoro)}
            type="button"
          >
            {state.activeAction === 'resume' ? '继续中...' : '继续'}
          </button>

          <button
            className="secondary-button"
            disabled={state.isBootstrapping || isActionBusy}
            onClick={() => runAction('reset', resetPomodoro)}
            type="button"
          >
            {state.activeAction === 'reset' ? '重置中...' : '重置'}
          </button>

          <button
            className="secondary-button"
            disabled={state.isBootstrapping || isActionBusy}
            onClick={() => runAction('skip', skipPomodoro)}
            type="button"
          >
            {state.activeAction === 'skip' ? '跳过中...' : '跳过'}
          </button>
        </div>

        <dl className="stats-grid">
          <div className="stat-card">
            <dt>当前阶段</dt>
            <dd>{modeMeta.label}</dd>
          </div>
          <div className="stat-card">
            <dt>已完成专注</dt>
            <dd>{state.pomodoro.completedFocusSessions} 次</dd>
          </div>
        </dl>

        {state.error ? <div className="message error">{state.error}</div> : null}
        {!state.error && state.isBootstrapping ? <div className="message">正在连接后端...</div> : null}
      </section>

      <section className="config-card">
        <div className="section-header">
          <div>
            <h2>时间设置</h2>
            <p>可编辑专注和休息分钟数，并同步到后端。</p>
          </div>
          <span className="api-pill">{pomodoroBasePath}</span>
        </div>

        <div className="config-grid">
          <label className="field">
            <span>专注时长（分钟）</span>
            <input
              max="180"
              min="1"
              onChange={(event) =>
                dispatch({ type: 'UPDATE_DRAFT_FOCUS', payload: event.target.value })
              }
              type="number"
              value={state.draftSettings.focusMinutes}
            />
          </label>

          <label className="field">
            <span>休息时长（分钟）</span>
            <input
              max="60"
              min="1"
              onChange={(event) =>
                dispatch({ type: 'UPDATE_DRAFT_BREAK', payload: event.target.value })
              }
              type="number"
              value={state.draftSettings.breakMinutes}
            />
          </label>
        </div>

        <button
          className="save-button"
          disabled={state.isBootstrapping || state.isSavingConfig || !hasValidSettings}
          onClick={handleSaveConfig}
          type="button"
        >
          {state.isSavingConfig ? '保存中...' : '保存设置'}
        </button>
      </section>
    </main>
  );
}
