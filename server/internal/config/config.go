package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Server ServerConfig `mapstructure:"server"`
	Log    LogConfig    `mapstructure:"log"`
}

type ServerConfig struct {
	Port         string `mapstructure:"port"`
	ReadTimeout  int    `mapstructure:"readTimeout"`
	WriteTimeout int    `mapstructure:"writeTimeout"`
}

type LogConfig struct {
	Level string `mapstructure:"level"`
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.readTimeout", 5)
	viper.SetDefault("server.writeTimeout", 5)
	viper.SetDefault("log.level", "info")

	viper.AutomaticEnv()
	viper.SetEnvPrefix("POMODORO")
	viper.BindEnv("server.port", "PORT")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			return &Config{
				Server: ServerConfig{
					Port:         "8080",
					ReadTimeout:  5,
					WriteTimeout: 5,
				},
				Log: LogConfig{
					Level: "info",
				},
			}, nil
		}
		return nil, err
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
