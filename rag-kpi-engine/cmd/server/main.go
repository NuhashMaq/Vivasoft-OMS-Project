package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"rag-kpi-engine/internal/chunk"
	"rag-kpi-engine/internal/config"
	"rag-kpi-engine/internal/embedding"
	"rag-kpi-engine/internal/jobs"
	"rag-kpi-engine/internal/service"
	"rag-kpi-engine/internal/storage"
	transport "rag-kpi-engine/internal/transport/http"
)

// main wires dependencies and starts HTTP + background worker processes.
func main() {
	// 1) Load configuration.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	// 2) Connect to PostgreSQL.
	repo, err := storage.NewPostgresRepository(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}
	defer repo.Close()

	// 3) Construct core services.
	chunker := chunk.New(cfg.ChunkMinWords, cfg.ChunkMaxWords)
	embedder := embedding.NewHF(
		cfg.HFApiToken,
		cfg.HFModelID,
		cfg.EmbeddingDim,
		cfg.HFTimeoutSeconds,
		true,
	)
	log.Printf("embedding provider: huggingface model=%s", cfg.HFModelID)

	indexer := service.NewIndexer(repo, chunker, embedder)
	searchSvc := service.NewSearchService(repo, embedder, cfg.RAGTopK)
	searchSvc.SetOptions(cfg.EnableSearchCache, cfg.EnableRerank, time.Duration(cfg.RAGCacheTTLSeconds)*time.Second)
	kpiSvc := service.NewKPIService(repo, cfg.EnableKPIInsights)
	wikiSvc := service.NewWikiService(repo, indexer)

	h := transport.NewHandler(indexer, searchSvc, wikiSvc, kpiSvc, repo)
	router := transport.NewRouter(h)

	// 4) Configure HTTP server.
	server := &http.Server{
		Addr:         ":" + cfg.AppPort,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 20 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 5) Start worker and server with graceful shutdown handling.
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	worker := jobs.NewWikiWorker(repo, wikiSvc, cfg.WikiRegenIntervalSecond)
	go worker.Start(ctx)

	go func() {
		log.Printf("RAG KPI Engine listening on :%s", cfg.AppPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownCtx)
	log.Println("server shutdown complete")
}
