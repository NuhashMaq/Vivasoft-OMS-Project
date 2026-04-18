package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	RAG      RAGConfig
}

type ServerConfig struct {
	Port string
	Host string
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	SecretKey   string
	ExpiryHours int
}

type RAGConfig struct {
	EngineURL string
}

func NewConfig() *Config {
	// Load .env file
	_ = godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8081"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "2103111"),
			DBName:   getEnv("DB_NAME", "office_management"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			SecretKey:   getEnv("JWT_SECRET_KEY", "your-secret-key-change-this"),
			ExpiryHours: getEnvAsInt("JWT_EXPIRY_HOURS", 24),
		},
		RAG: RAGConfig{
			EngineURL: getEnv("RAG_ENGINE_URL", "http://rag:8085"),
		},
	}
}

func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}

func (c *Config) GetServerAddress() string {
	return c.Server.Host + ":" + c.Server.Port
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

