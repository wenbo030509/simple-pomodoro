import { useEffect, useReducer } from 'react';
import {
  DEFAULT_STATE,
  fetchPomodoroState,
  pausePomodoro,
  resetPomodoro,
  resumePomodoro,
  skipPomodoro,
  startPomodoro,
  updatePomodoroConfig,
} from './api/pomodoro.js';

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

export function usePomodoro() {
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

  return {
    state,
    dispatch,
    runAction,
    handleSaveConfig,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    skipPomodoro,
  };
}
