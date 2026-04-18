package jobs

import (
	"context"
	"log"
	"time"

	"rag-kpi-engine/internal/service"
	"rag-kpi-engine/internal/storage"
)

const staleBatchSize = 20

// WikiWorker periodically regenerates stale project wikis.
type WikiWorker struct {
	repo     *storage.PostgresRepository
	wiki     *service.WikiService
	interval time.Duration
}

// NewWikiWorker creates a worker with configurable interval.
func NewWikiWorker(repo *storage.PostgresRepository, wiki *service.WikiService, intervalSec int) *WikiWorker {
	if intervalSec <= 0 {
		intervalSec = 30
	}
	return &WikiWorker{repo: repo, wiki: wiki, interval: time.Duration(intervalSec) * time.Second}
}

// Start runs the worker loop until context cancellation.
func (w *WikiWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.cycle(ctx)
		}
	}
}

// cycle processes stale projects in small batches.
func (w *WikiWorker) cycle(ctx context.Context) {
	projects, err := w.repo.ListStaleProjects(ctx, staleBatchSize)
	if err != nil {
		log.Printf("wiki worker list stale error: %v", err)
		return
	}
	for _, projectID := range projects {
		if _, err := w.wiki.Regenerate(ctx, projectID, "wiki-worker"); err != nil {
			log.Printf("wiki regenerate failed project=%s err=%v", projectID, err)
		}
	}
}
