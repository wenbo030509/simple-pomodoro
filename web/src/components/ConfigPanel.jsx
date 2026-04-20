export function ConfigPanel({
  isBootstrapping,
  isSavingConfig,
  draftSettings,
  hasValidSettings,
  dispatch,
  handleSaveConfig,
}) {
  return (
    <section className="config-card">
      <div className="section-header">
        <div>
          <h2>时间设置</h2>
          <p>可编辑专注和休息分钟数，并同步到后端。</p>
        </div>
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
            value={draftSettings.focusMinutes}
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
  );
}
