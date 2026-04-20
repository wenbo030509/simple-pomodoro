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

export function StatusPill({ mode }) {
  const modeMeta = getModeMeta(mode);
  return (
    <div className={`status-pill ${mode}`}>
      <span className="status-dot" />
      {modeMeta.label}
    </div>
  );
}

export function Timer({ remainingSeconds, isRunning }) {
  return (
    <div className="timer-panel">
      <div className="timer-face">{formatTime(remainingSeconds)}</div>
      <div className="timer-caption">
        {isRunning ? '当前正在倒计时' : '当前已暂停，随时可以继续'}
      </div>
    </div>
  );
}

export function StatsGrid({ mode, completedFocusSessions }) {
  const modeMeta = getModeMeta(mode);
  return (
    <dl className="stats-grid">
      <div className="stat-card">
        <dt>当前阶段</dt>
        <dd>{modeMeta.label}</dd>
      </div>
      <div className="stat-card">
        <dt>已完成专注</dt>
        <dd>{completedFocusSessions} 次</dd>
      </div>
    </dl>
  );
}

export function HeroTitle({ mode }) {
  const modeMeta = getModeMeta(mode);
  return (
    <>
      <h1 className="hero-title">番茄钟 MVP</h1>
      <p className="hero-subtitle">{modeMeta.hint}</p>
    </>
  );
}
