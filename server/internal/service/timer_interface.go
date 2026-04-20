package service

import "pomodoro-mvp/internal/model"

type Timer interface {
	GetSnapshot() model.Snapshot
	Start() model.Snapshot
	Pause() model.Snapshot
	Resume() model.Snapshot
	Reset() model.Snapshot
	Skip() model.Snapshot
	UpdateSettings(focusMinutes, breakMinutes *int) (model.Snapshot, error)
}
