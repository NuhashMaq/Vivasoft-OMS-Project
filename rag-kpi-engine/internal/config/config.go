package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config contains runtime settings loaded from environment variables.
type Config struct {
	AppPort                 string
	DatabaseURL             string
	HFModelID               string
	HFApiToken              string
	HFTimeoutSeconds        int
	EmbeddingDim            int
	RAGTopK                 int
	RAGCacheTTLSeconds      int
	ChunkMinWords           int
	ChunkMaxWords           int
	WikiRegenIntervalSecond int
	EnableRerank            bool
	EnableSearchCache       bool
	EnableKPIInsights       bool
}

// Load reads environment variables, fills defaults, and validates config.
func Load() (Config, error) {
	cfg := Config{
		AppPort:                 getEnv("APP_PORT", "8085"),
		DatabaseURL:             os.Getenv("DATABASE_URL"),
		HFModelID:               getEnv("HF_MODEL_ID", "sentence-transformers/all-MiniLM-L6-v2"),
		HFApiToken:              os.Getenv("HF_API_TOKEN"),
		HFTimeoutSeconds:        getEnvInt("HF_TIMEOUT_SECONDS", 30),
		EmbeddingDim:            getEnvInt("EMBEDDING_DIM", 128),
		RAGTopK:                 getEnvInt("RAG_TOPK", 10),
		RAGCacheTTLSeconds:      getEnvInt("RAG_CACHE_TTL_SECONDS", 300),
		ChunkMinWords:           getEnvInt("CHUNK_MIN_WORDS", 80),
		ChunkMaxWords:           getEnvInt("CHUNK_MAX_WORDS", 220),
		WikiRegenIntervalSecond: getEnvInt("WIKI_REGEN_INTERVAL_SECONDS", 30),
		EnableRerank:            getEnvBool("ENABLE_RERANK", true),
		EnableSearchCache:       getEnvBool("ENABLE_SEARCH_CACHE", true),
		EnableKPIInsights:       getEnvBool("ENABLE_KPI_INSIGHTS", true),
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}



// validate enforces minimum constraints needed for safe startup.
func (cfg Config) validate() error {
	if cfg.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.EmbeddingDim <= 0 {
		return fmt.Errorf("EMBEDDING_DIM must be > 0")
	}
	if cfg.HFModelID == "" {
		return fmt.Errorf("HF_MODEL_ID is required")
	}
	if cfg.ChunkMaxWords < cfg.ChunkMinWords {
		return fmt.Errorf("CHUNK_MAX_WORDS must be >= CHUNK_MIN_WORDS")
	}
	if cfg.RAGCacheTTLSeconds < 0 {
		return fmt.Errorf("RAG_CACHE_TTL_SECONDS must be >= 0")
	}
	if cfg.HFTimeoutSeconds <= 0 {
		return fmt.Errorf("HF_TIMEOUT_SECONDS must be > 0")
	}
	return nil
}

// getEnv returns an environment variable, or defaultVal if missing.
func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

// getEnvInt returns an integer environment variable, or defaultVal if missing/invalid.
func getEnvInt(key string, defaultVal int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	parsed, err := strconv.Atoi(v)
	if err != nil {
		return defaultVal
	}
	return parsed
}

// getEnvBool returns a boolean environment variable, or defaultVal if missing/invalid.
func getEnvBool(key string, defaultVal bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	parsed, err := strconv.ParseBool(v)
	if err != nil {
		return defaultVal
	}
	return parsed
}
