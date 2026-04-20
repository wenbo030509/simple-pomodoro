import { usePomodoro } from './hooks/usePomodoro.js';
import { ActionButtons } from './components/ActionButtons.jsx';
import { ConfigPanel } from './components/ConfigPanel.jsx';
import { Message } from './components/Message.jsx';
import { HeroTitle, StatusPill, StatsGrid, Timer } from './components/Timer.jsx';

export default function App() {
  const {
    state,
    dispatch,
    runAction,
    handleSaveConfig,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    skipPomodoro,
  } = usePomodoro();

  const hasValidSettings =
    Number(state.draftSettings.focusMinutes) >= 1 &&
    Number(state.draftSettings.focusMinutes) <= 180 &&
    Number(state.draftSettings.breakMinutes) >= 1 &&
    Number(state.draftSettings.breakMinutes) <= 60;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <StatusPill mode={state.pomodoro.mode} />
        <HeroTitle mode={state.pomodoro.mode} />
        <Timer
          remainingSeconds={state.pomodoro.remainingSeconds}
          isRunning={state.pomodoro.isRunning}
        />
        <ActionButtons
          isBootstrapping={state.isBootstrapping}
          isRunning={state.pomodoro.isRunning}
          status={state.pomodoro.status}
          activeAction={state.activeAction}
          runAction={runAction}
          startPomodoro={startPomodoro}
          pausePomodoro={pausePomodoro}
          resumePomodoro={resumePomodoro}
          resetPomodoro={resetPomodoro}
          skipPomodoro={skipPomodoro}
        />
        <StatsGrid
          mode={state.pomodoro.mode}
          completedFocusSessions={state.pomodoro.completedFocusSessions}
        />
        <Message error={state.error} isBootstrapping={state.isBootstrapping} />
      </section>

      <ConfigPanel
        isBootstrapping={state.isBootstrapping}
        isSavingConfig={state.isSavingConfig}
        draftSettings={state.draftSettings}
        hasValidSettings={hasValidSettings}
        dispatch={dispatch}
        handleSaveConfig={handleSaveConfig}
      />
    </main>
  );
}
