package main

import (
	"log"
	"net/http"
	"time"

	"pomodoro-mvp/internal/config"
	"pomodoro-mvp/internal/handler"
	"pomodoro-mvp/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("warning: failed to load config: %v, using defaults", err)
	}

	router := gin.Default()

	router.Use(middleware.CORS())
	router.Use(middleware.Logging())

	pomodoroHandler := handler.NewPomodoroHandler()

	router.GET("/health", handler.HandleHealth)

	api := router.Group("/api")
	{
		api.GET("/state", pomodoroHandler.GetState)
		api.GET("/pomodoro", pomodoroHandler.GetState)

		api.POST("/start", pomodoroHandler.Start)
		api.POST("/pomodoro/start", pomodoroHandler.Start)

		api.POST("/pause", pomodoroHandler.Pause)
		api.POST("/pomodoro/pause", pomodoroHandler.Pause)

		api.POST("/resume", pomodoroHandler.Resume)
		api.POST("/pomodoro/resume", pomodoroHandler.Resume)

		api.POST("/reset", pomodoroHandler.Reset)
		api.POST("/pomodoro/reset", pomodoroHandler.Reset)

		api.POST("/skip", pomodoroHandler.Skip)
		api.POST("/pomodoro/skip", pomodoroHandler.Skip)

		api.POST("/settings", pomodoroHandler.UpdateSettings)
		api.PUT("/settings", pomodoroHandler.UpdateSettings)
		api.POST("/pomodoro/durations", pomodoroHandler.UpdateSettings)
		api.PUT("/pomodoro/durations", pomodoroHandler.UpdateSettings)
	}

	addr := cfg.Server.Port
	if addr == "" {
		addr = "8080"
	}
	if addr[0] != ':' {
		addr = ":" + addr
	}

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	log.Printf("Pomodoro server listening on http://localhost%s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
