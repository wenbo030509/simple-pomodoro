import { useEffect, useState } from 'react';
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

export default function App() {
  const [pomodoro, setPomodoro] = useState(DEFAULT_STATE);
  const [draftSettings, setDraftSettings] = useState({
    focusMinutes: DEFAULT_STATE.focusMinutes,
    breakMinutes: DEFAULT_STATE.breakMinutes,
  });
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [error, setError] = useState('');

  async function syncState() {
    const state = await fetchPomodoroState();
    setPomodoro(state);
    setDraftSettings({
      focusMinutes: state.focusMinutes,
      breakMinutes: state.breakMinutes,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const state = await fetchPomodoroState();
        if (cancelled) {
          return;
        }

        setPomodoro(state);
        setDraftSettings({
          focusMinutes: state.focusMinutes,
          breakMinutes: state.breakMinutes,
        });
        setError('');
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(bootstrapError.message);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping) {
      return undefined;
    }

    let disposed = false;
    const interval = window.setInterval(async () => {
      try {
        const state = await fetchPomodoroState();
        if (!disposed) {
          setPomodoro(state);
          setError('');
        }
      } catch (pollError) {
        if (!disposed) {
          setError(pollError.message);
        }
      }
    }, pomodoro.isRunning ? 1000 : 10000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [isBootstrapping, pomodoro.isRunning]);

  async function runAction(actionName, action) {
    setActiveAction(actionName);
    setError('');

    try {
      const nextState = await action();

      if (nextState) {
        setPomodoro(nextState);
        setDraftSettings({
          focusMinutes: nextState.focusMinutes,
          breakMinutes: nextState.breakMinutes,
        });
      } else {
        await syncState();
      }
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActiveAction('');
    }
  }

  async function handleSaveConfig() {
    const focusMinutes = Number(draftSettings.focusMinutes);
    const breakMinutes = Number(draftSettings.breakMinutes);

    if (!Number.isFinite(focusMinutes) || !Number.isFinite(breakMinutes)) {
      setError('请输入有效的分钟数。');
      return;
    }

    setIsSavingConfig(true);
    setError('');

    try {
      const nextState = await updatePomodoroConfig({
        focusMinutes,
        breakMinutes,
      });

      if (nextState) {
        setPomodoro(nextState);
        setDraftSettings({
          focusMinutes: nextState.focusMinutes,
          breakMinutes: nextState.breakMinutes,
        });
      } else {
        await syncState();
      }
    } catch (configError) {
      setError(configError.message);
    } finally {
      setIsSavingConfig(false);
    }
  }

  const modeMeta = getModeMeta(pomodoro.mode);
  const isActionBusy = activeAction !== '';
  const hasValidSettings =
    Number(draftSettings.focusMinutes) >= 1 &&
    Number(draftSettings.focusMinutes) <= 180 &&
    Number(draftSettings.breakMinutes) >= 1 &&
    Number(draftSettings.breakMinutes) <= 60;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className={`status-pill ${pomodoro.mode}`}>
          <span className="status-dot" />
          {modeMeta.label}
        </div>

        <h1 className="hero-title">番茄钟 MVP</h1>
        <p className="hero-subtitle">{modeMeta.hint}</p>

        <div className="timer-panel">
          <div className="timer-face">{formatTime(pomodoro.remainingSeconds)}</div>
          <div className="timer-caption">
            {pomodoro.isRunning ? '当前正在倒计时' : '当前已暂停，随时可以继续'}
          </div>
        </div>

        <div className="action-grid">
          <button
            className="primary-button"
            disabled={isBootstrapping || isActionBusy || pomodoro.isRunning}
            onClick={() => runAction('start', startPomodoro)}
            type="button"
          >
            {activeAction === 'start' ? '启动中...' : '开始'}
          </button>

          <button
            className="secondary-button"
            disabled={isBootstrapping || isActionBusy || !pomodoro.isRunning}
            onClick={() => runAction('pause', pausePomodoro)}
            type="button"
          >
            {activeAction === 'pause' ? '暂停中...' : '暂停'}
          </button>

          <button
            className="secondary-button"
            disabled={isBootstrapping || isActionBusy || pomodoro.isRunning || pomodoro.status === 'idle'}
            onClick={() => runAction('resume', resumePomodoro)}
            type="button"
          >
            {activeAction === 'resume' ? '继续中...' : '继续'}
          </button>

          <button
            className="secondary-button"
            disabled={isBootstrapping || isActionBusy}
            onClick={() => runAction('reset', resetPomodoro)}
            type="button"
          >
            {activeAction === 'reset' ? '重置中...' : '重置'}
          </button>

          <button
            className="secondary-button"
            disabled={isBootstrapping || isActionBusy}
            onClick={() => runAction('skip', skipPomodoro)}
            type="button"
          >
            {activeAction === 'skip' ? '跳过中...' : '跳过'}
          </button>
        </div>

        <dl className="stats-grid">
          <div className="stat-card">
            <dt>当前阶段</dt>
            <dd>{modeMeta.label}</dd>
          </div>
          <div className="stat-card">
            <dt>已完成专注</dt>
            <dd>{pomodoro.completedFocusSessions} 次</dd>
          </div>
        </dl>

        {error ? <div className="message error">{error}</div> : null}
        {!error && isBootstrapping ? <div className="message">正在连接后端...</div> : null}
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
                setDraftSettings((current) => ({
                  ...current,
                  focusMinutes: event.target.value,
                }))
              }
              type="number"
              value={draftSettings.focusMinutes}
            />
          </label>

          <label className="field">
            <span>休息时长（分钟）</span>
            <input
              max="60"
              min="1"
              onChange={(event) =>
                setDraftSettings((current) => ({
                  ...current,
                  breakMinutes: event.target.value,
                }))
              }
              type="number"
              value={draftSettings.breakMinutes}
            />
          </label>
        </div>

        <button
          className="save-button"
          disabled={isBootstrapping || isSavingConfig || !hasValidSettings}
          onClick={handleSaveConfig}
          type="button"
        >
          {isSavingConfig ? '保存中...' : '保存设置'}
        </button>
      </section>
    </main>
  );
}
