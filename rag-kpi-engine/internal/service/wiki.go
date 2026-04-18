package service

import (
	"context"
	"fmt"

	"rag-kpi-engine/internal/domain"
	"rag-kpi-engine/internal/storage"
)

const defaultWikiTitle = "Project Wiki"

// WikiService manages wiki stale state and wiki regeneration.
type WikiService struct {
	repo    *storage.PostgresRepository
	indexer *Indexer
}

// NewWikiService creates a wiki service.
func NewWikiService(repo *storage.PostgresRepository, indexer *Indexer) *WikiService {
	return &WikiService{repo: repo, indexer: indexer}
}

// MarkStale marks a project wiki as stale and schedules regeneration.
func (w *WikiService) MarkStale(ctx context.Context, projectID string) error {
	if projectID == "" {
		return fmt.Errorf("project_id is required")
	}
	return w.repo.MarkWikiStale(ctx, projectID)
}

// Regenerate builds wiki content from sources, stores a new wiki version,
// and re-indexes the generated wiki as searchable knowledge.
func (w *WikiService) Regenerate(ctx context.Context, projectID string, actor string) (string, error) {
	knowledge, refs, err := w.repo.BuildProjectKnowledge(ctx, projectID)
	if err != nil {
		return "", err
	}
	if knowledge == "" {
		knowledge = "No project knowledge is currently available."
	}

	versionID, err := w.repo.CreateWikiVersion(ctx, projectID, knowledge, refs)
	if err != nil {
		return "", err
	}

	if err = w.indexer.Index(ctx, domain.IndexRequest{
		ProjectID: projectID,
		DocType:   domain.DocTypeWiki,
		SourceID:  versionID,
		Title:     defaultWikiTitle,
		Content:   knowledge,
		UpdatedBy: actor,
	}); err != nil {
		return "", err
	}
	return versionID, nil
}
