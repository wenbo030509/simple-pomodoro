package model

type TimerMode string

const (
	ModeFocus TimerMode = "focus"
	ModeBreak TimerMode = "break"
)

type TimerStatus string

const (
	StatusIdle    TimerStatus = "idle"
	StatusRunning TimerStatus = "running"
	StatusPaused  TimerStatus = "paused"
)

type TimerState struct {
	Mode                   TimerMode   `json:"mode"`
	Status                 TimerStatus `json:"status"`
	FocusMinutes           int         `json:"focusMinutes"`
	BreakMinutes           int         `json:"breakMinutes"`
	RemainingSeconds       int         `json:"remainingSeconds"`
	CompletedFocusSessions int         `json:"completedFocusSessions"`
}

type Snapshot struct {
	Phase                  string  `json:"phase"`
	Mode                   string  `json:"mode"`
	ModeLabel              string  `json:"modeLabel"`
	Status                 string  `json:"status"`
	IsRunning              bool    `json:"isRunning"`
	RemainingSeconds       int     `json:"remainingSeconds"`
	FocusMinutes           int     `json:"focusMinutes"`
	BreakMinutes           int     `json:"breakMinutes"`
	FocusDurationSeconds   int     `json:"focusDurationSeconds"`
	BreakDurationSeconds   int     `json:"breakDurationSeconds"`
	CompletedFocusSessions int     `json:"completedFocusSessions"`
	TotalPhaseSeconds      int     `json:"totalPhaseSeconds"`
	Progress               float64 `json:"progress"`
}

type SettingsPayload struct {
	FocusMinutes *int `json:"focusMinutes"`
	BreakMinutes *int `json:"breakMinutes"`
}

type HealthResponse struct {
	Status string `json:"status"`
	Time   string `json:"time"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
