package service

import (
	"math"
	"sync"
	"time"

	"pomodoro-mvp/internal/model"
)

type TimerService struct {
	mu             sync.Mutex
	mode           model.TimerMode
	status         model.TimerStatus
	focusMinutes   int
	breakMinutes   int
	remainingSeconds int
	deadline       time.Time
	completedFocusSessions int
}

func NewTimerService() *TimerService {
	return &TimerService{
		mode:             model.ModeFocus,
		status:           model.StatusIdle,
		focusMinutes:     25,
		breakMinutes:     5,
		remainingSeconds: 25 * 60,
	}
}

func (t *TimerService) GetSnapshot() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.advanceLocked(now)
	return t.snapshotLocked(now)
}

func (t *TimerService) Start() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.mode = model.ModeFocus
	t.status = model.StatusRunning
	t.remainingSeconds = t.focusMinutes * 60
	t.deadline = now.Add(time.Duration(t.remainingSeconds) * time.Second)

	return t.snapshotLocked(now)
}

func (t *TimerService) Pause() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.advanceLocked(now)
	if t.status == model.StatusRunning {
		t.remainingSeconds = remainingUntil(t.deadline, now)
		t.status = model.StatusPaused
		t.deadline = time.Time{}
	}

	return t.snapshotLocked(now)
}

func (t *TimerService) Resume() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.advanceLocked(now)
	if t.status == model.StatusPaused {
		if t.remainingSeconds <= 0 {
			t.remainingSeconds = t.phaseDurationSecondsLocked()
		}
		t.status = model.StatusRunning
		t.deadline = now.Add(time.Duration(t.remainingSeconds) * time.Second)
	}

	return t.snapshotLocked(now)
}

func (t *TimerService) Reset() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.mode = model.ModeFocus
	t.status = model.StatusIdle
	t.remainingSeconds = t.focusMinutes * 60
	t.deadline = time.Time{}

	return t.snapshotLocked(time.Now())
}

func (t *TimerService) Skip() model.Snapshot {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.advanceLocked(now)
	wasRunning := t.status == model.StatusRunning
	t.moveToNextPhaseLocked(false)
	if wasRunning {
		t.deadline = now.Add(time.Duration(t.remainingSeconds) * time.Second)
	} else {
		t.deadline = time.Time{}
	}

	return t.snapshotLocked(now)
}

func (t *TimerService) UpdateSettings(focusMinutes, breakMinutes *int) (model.Snapshot, error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	t.advanceLocked(now)

	if focusMinutes != nil {
		if *focusMinutes < 1 || *focusMinutes > 180 {
			return model.Snapshot{}, &ValidationError{Message: "focusMinutes must be between 1 and 180"}
		}
		t.focusMinutes = *focusMinutes
	}

	if breakMinutes != nil {
		if *breakMinutes < 1 || *breakMinutes > 60 {
			return model.Snapshot{}, &ValidationError{Message: "breakMinutes must be between 1 and 60"}
		}
		t.breakMinutes = *breakMinutes
	}

	t.remainingSeconds = t.phaseDurationSecondsLocked()
	if t.status == model.StatusRunning {
		t.deadline = now.Add(time.Duration(t.remainingSeconds) * time.Second)
	}

	return t.snapshotLocked(now), nil
}

func (t *TimerService) advanceLocked(now time.Time) {
	if t.status != model.StatusRunning {
		return
	}

	for !t.deadline.IsZero() && !now.Before(t.deadline) {
		t.moveToNextPhaseLocked(true)
		t.deadline = t.deadline.Add(time.Duration(t.remainingSeconds) * time.Second)
	}
}

func (t *TimerService) moveToNextPhaseLocked(countCompleted bool) {
	if t.mode == model.ModeFocus {
		if countCompleted {
			t.completedFocusSessions++
		}
		t.mode = model.ModeBreak
		t.remainingSeconds = t.breakMinutes * 60
		return
	}

	t.mode = model.ModeFocus
	t.remainingSeconds = t.focusMinutes * 60
}

func (t *TimerService) phaseDurationSecondsLocked() int {
	if t.mode == model.ModeBreak {
		return t.breakMinutes * 60
	}
	return t.focusMinutes * 60
}

func (t *TimerService) snapshotLocked(now time.Time) model.Snapshot {
	remaining := t.remainingSeconds
	isRunning := t.status == model.StatusRunning
	if isRunning {
		remaining = remainingUntil(t.deadline, now)
	}

	total := t.phaseDurationSecondsLocked()
	progress := 0.0
	if total > 0 {
		progress = float64(total-remaining) / float64(total)
		if progress < 0 {
			progress = 0
		}
		if progress > 1 {
			progress = 1
		}
	}

	label := "专注"
	if t.mode == model.ModeBreak {
		label = "休息"
	}

	return model.Snapshot{
		Phase:                  string(t.mode),
		Mode:                   string(t.mode),
		ModeLabel:              label,
		Status:                 string(t.status),
		IsRunning:              isRunning,
		RemainingSeconds:       remaining,
		FocusMinutes:           t.focusMinutes,
		BreakMinutes:           t.breakMinutes,
		FocusDurationSeconds:   t.focusMinutes * 60,
		BreakDurationSeconds:   t.breakMinutes * 60,
		CompletedFocusSessions: t.completedFocusSessions,
		TotalPhaseSeconds:      total,
		Progress:               progress,
	}
}

func remainingUntil(deadline time.Time, now time.Time) int {
	seconds := int(math.Ceil(deadline.Sub(now).Seconds()))
	if seconds < 0 {
		return 0
	}
	return seconds
}

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
