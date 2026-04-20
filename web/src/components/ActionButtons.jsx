export function ActionButtons({
  isBootstrapping,
  isRunning,
  status,
  activeAction,
  runAction,
  startPomodoro,
  pausePomodoro,
  resumePomodoro,
  resetPomodoro,
  skipPomodoro,
}) {
  const isActionBusy = activeAction !== '';

  return (
    <div className="action-grid">
      <button
        className="primary-button"
        disabled={isBootstrapping || isActionBusy || isRunning}
        onClick={() => runAction('start', startPomodoro)}
        type="button"
      >
        {activeAction === 'start' ? '启动中...' : '开始'}
      </button>

      <button
        className="secondary-button"
        disabled={isBootstrapping || isActionBusy || !isRunning}
        onClick={() => runAction('pause', pausePomodoro)}
        type="button"
      >
        {activeAction === 'pause' ? '暂停中...' : '暂停'}
      </button>

      <button
        className="secondary-button"
        disabled={isBootstrapping || isActionBusy || isRunning || status === 'idle'}
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
  );
}
