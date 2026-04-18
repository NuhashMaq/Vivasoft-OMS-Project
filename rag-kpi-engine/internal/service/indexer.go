package service

import (
	"context"
	"fmt"

	"rag-kpi-engine/internal/chunk"
	"rag-kpi-engine/internal/domain"
	"rag-kpi-engine/internal/embedding"
	"rag-kpi-engine/internal/storage"

	"github.com/google/uuid"
)

// Indexer orchestrates chunking, embedding, and persistence.
type Indexer struct {
	repo     *storage.PostgresRepository
	chunker  *chunk.Chunker
	embedder embedding.Provider
}

// NewIndexer creates a new indexing service.
func NewIndexer(repo *storage.PostgresRepository, chunker *chunk.Chunker, embedder embedding.Provider) *Indexer {
	return &Indexer{repo: repo, chunker: chunker, embedder: embedder}
}

// Index takes a source document and upserts its chunks + embeddings.
func (i *Indexer) Index(ctx context.Context, req domain.IndexRequest) error {
	if err := validateIndexRequest(&req); err != nil {
		return err
	}

	chunks := i.chunker.Build(req.Title, req.Content)
	if len(chunks) == 0 {
		return fmt.Errorf("no chunks generated")
	}

	chunkRows := make([]domain.ChunkRecord, 0, len(chunks))
	for idx, text := range chunks {
		emb, err := i.embedder.Embed(ctx, text)
		if err != nil {
			return err
		}
		chunkRows = append(chunkRows, domain.ChunkRecord{
			ChunkID:    uuid.NewString(),
			ProjectID:  req.ProjectID,
			DocType:    req.DocType,
			TaskID:     req.TaskID,
			SourceID:   req.SourceID,
			Title:      req.Title,
			Content:    text,
			ChunkIndex: idx,
			Embedding:  emb,
		})
	}

	return i.repo.ReplaceSourceChunks(ctx, req, chunkRows)
}

func validateIndexRequest(req *domain.IndexRequest) error {
	if req.ProjectID == "" || req.SourceID == "" || req.Content == "" {
		return fmt.Errorf("project_id, source_id and content are required")
	}

	req.DocType = domain.NormalizeDocType(req.DocType)
	if req.DocType != domain.DocTypeTask && req.DocType != domain.DocTypeDailyUpdate && req.DocType != domain.DocTypeWiki {
		return fmt.Errorf("invalid doc_type: %s", req.DocType)
	}

	return nil
}
