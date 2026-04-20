package service

import (
	"pomodoro-mvp/internal/model"
	"testing"
)

func TestNewTimerService(t *testing.T) {
	svc := NewTimerService()

	if svc.mode != model.ModeFocus {
		t.Errorf("expected mode to be focus, got %v", svc.mode)
	}
	if svc.status != model.StatusIdle {
		t.Errorf("expected status to be idle, got %v", svc.status)
	}
	if svc.focusMinutes != 25 {
		t.Errorf("expected focusMinutes to be 25, got %d", svc.focusMinutes)
	}
	if svc.breakMinutes != 5 {
		t.Errorf("expected breakMinutes to be 5, got %d", svc.breakMinutes)
	}
	if svc.remainingSeconds != 1500 {
		t.Errorf("expected remainingSeconds to be 1500, got %d", svc.remainingSeconds)
	}
}

func TestTimerService_Start(t *testing.T) {
	svc := NewTimerService()
	snapshot := svc.Start()

	if snapshot.Mode != "focus" {
		t.Errorf("expected mode focus, got %s", snapshot.Mode)
	}
	if snapshot.Status != "running" {
		t.Errorf("expected status running, got %s", snapshot.Status)
	}
	if !snapshot.IsRunning {
		t.Error("expected IsRunning to be true")
	}
	if snapshot.RemainingSeconds != 1500 {
		t.Errorf("expected remainingSeconds 1500, got %d", snapshot.RemainingSeconds)
	}
}

func TestTimerService_Pause(t *testing.T) {
	svc := NewTimerService()
	svc.Start()
	snapshot := svc.Pause()

	if snapshot.Status != "paused" {
		t.Errorf("expected status paused, got %s", snapshot.Status)
	}
	if snapshot.IsRunning {
		t.Error("expected IsRunning to be false after pause")
	}
}

func TestTimerService_Resume(t *testing.T) {
	svc := NewTimerService()
	svc.Start()
	svc.Pause()
	snapshot := svc.Resume()

	if snapshot.Status != "running" {
		t.Errorf("expected status running, got %s", snapshot.Status)
	}
	if !snapshot.IsRunning {
		t.Error("expected IsRunning to be true after resume")
	}
}

func TestTimerService_Reset(t *testing.T) {
	svc := NewTimerService()
	svc.Start()
	snapshot := svc.Reset()

	if snapshot.Status != "idle" {
		t.Errorf("expected status idle, got %s", snapshot.Status)
	}
	if snapshot.IsRunning {
		t.Error("expected IsRunning to be false after reset")
	}
	if snapshot.RemainingSeconds != 1500 {
		t.Errorf("expected remainingSeconds 1500, got %d", snapshot.RemainingSeconds)
	}
}

func TestTimerService_Skip(t *testing.T) {
	svc := NewTimerService()
	svc.Start()
	snapshot := svc.Skip()

	if snapshot.Mode != "break" {
		t.Errorf("expected mode break after skip, got %s", snapshot.Mode)
	}
	if snapshot.CompletedFocusSessions != 0 {
		t.Errorf("expected completedFocusSessions 0 (manual skip not counted), got %d", snapshot.CompletedFocusSessions)
	}
}

func TestTimerService_UpdateSettings(t *testing.T) {
	svc := NewTimerService()

	focus := 30
	breakTime := 10
	snapshot, err := svc.UpdateSettings(&focus, &breakTime)

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if snapshot.FocusMinutes != 30 {
		t.Errorf("expected focusMinutes 30, got %d", snapshot.FocusMinutes)
	}
	if snapshot.BreakMinutes != 10 {
		t.Errorf("expected breakMinutes 10, got %d", snapshot.BreakMinutes)
	}
}

func TestTimerService_UpdateSettings_InvalidFocus(t *testing.T) {
	svc := NewTimerService()

	focus := 200
	_, err := svc.UpdateSettings(&focus, nil)

	if err == nil {
		t.Error("expected error for invalid focusMinutes")
	}
}

func TestTimerService_UpdateSettings_InvalidBreak(t *testing.T) {
	svc := NewTimerService()

	breakTime := 100
	_, err := svc.UpdateSettings(nil, &breakTime)

	if err == nil {
		t.Error("expected error for invalid breakMinutes")
	}
}

func TestTimerService_GetSnapshot(t *testing.T) {
	svc := NewTimerService()
	snapshot := svc.GetSnapshot()

	if snapshot.FocusMinutes != 25 {
		t.Errorf("expected focusMinutes 25, got %d", snapshot.FocusMinutes)
	}
	if snapshot.BreakMinutes != 5 {
		t.Errorf("expected breakMinutes 5, got %d", snapshot.BreakMinutes)
	}
	if snapshot.Progress != 0 {
		t.Errorf("expected progress 0, got %f", snapshot.Progress)
	}
}
