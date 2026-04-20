package handler

import (
	"net/http"
	"time"

	"pomodoro-mvp/internal/model"
	"pomodoro-mvp/internal/service"

	"github.com/gin-gonic/gin"
)

type PomodoroHandler struct {
	timerService *service.TimerService
}

func NewPomodoroHandler() *PomodoroHandler {
	return &PomodoroHandler{
		timerService: service.NewTimerService(),
	}
}

func (h *PomodoroHandler) GetState(c *gin.Context) {
	snapshot := h.timerService.GetSnapshot()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) Start(c *gin.Context) {
	snapshot := h.timerService.Start()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) Pause(c *gin.Context) {
	snapshot := h.timerService.Pause()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) Resume(c *gin.Context) {
	snapshot := h.timerService.Resume()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) Reset(c *gin.Context) {
	snapshot := h.timerService.Reset()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) Skip(c *gin.Context) {
	snapshot := h.timerService.Skip()
	c.JSON(http.StatusOK, snapshot)
}

func (h *PomodoroHandler) UpdateSettings(c *gin.Context) {
	var payload model.SettingsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "invalid JSON payload"})
		return
	}

	if payload.FocusMinutes == nil && payload.BreakMinutes == nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "at least one of focusMinutes or breakMinutes is required"})
		return
	}

	snapshot, err := h.timerService.UpdateSettings(payload.FocusMinutes, payload.BreakMinutes)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, snapshot)
}

func HandleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, model.HealthResponse{
		Status: "ok",
		Time:   time.Now().Format(time.RFC3339),
	})
}
