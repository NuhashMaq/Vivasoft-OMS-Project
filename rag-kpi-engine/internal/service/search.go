package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"rag-kpi-engine/internal/app"
	"rag-kpi-engine/internal/domain"
	"rag-kpi-engine/internal/embedding"
	"rag-kpi-engine/internal/storage"
)

const (
	defaultMaxSearchResult = 50
	rrfK                  = 60.0
	maxSnippetLength      = 260
)

// SearchService executes project-scoped retrieval with RBAC checks.
type SearchService struct {
	repo      *storage.PostgresRepository
	embedder  embedding.Provider
	defaultK  int
	maxResult int
	cacheTTL  time.Duration
	enableCache bool
	enableRerank bool
}

// NewSearchService creates a search service instance.
func NewSearchService(repo *storage.PostgresRepository, embedder embedding.Provider, defaultK int) *SearchService {
	return &SearchService{
		repo: repo,
		embedder: embedder,
		defaultK: defaultK,
		maxResult: defaultMaxSearchResult,
		cacheTTL: 5 * time.Minute,
	}
}

// SetOptions configures optional retrieval features.
func (s *SearchService) SetOptions(enableCache, enableRerank bool, cacheTTL time.Duration) {
	s.enableCache = enableCache
	s.enableRerank = enableRerank
	if cacheTTL > 0 {
		s.cacheTTL = cacheTTL
	}
}

// Search retrieves ranked evidence using hybrid (vector + keyword) retrieval.
func (s *SearchService) Search(ctx context.Context, user domain.UserContext, req domain.SearchRequest) (domain.SearchResponse, error) {
	if req.ProjectID == "" || strings.TrimSpace(req.Query) == "" {
		return domain.SearchResponse{}, fmt.Errorf("project_id and query are required")
	}
	allowed, err := s.repo.CheckProjectAccess(ctx, user, req.ProjectID)
	if err != nil {
		return domain.SearchResponse{}, err
	}
	if !allowed {
		return domain.SearchResponse{}, app.ErrUnauthorized
	}

	topK := s.resolveTopK(req.TopK)

	if s.enableCache {
		cached, found, err := s.repo.GetCachedSearch(ctx, req.ProjectID, req.Query, topK)
		if err == nil && found {
			return domain.SearchResponse{ProjectID: req.ProjectID, Query: req.Query, Results: cached}, nil
		}
	}

	emb, err := s.embedder.Embed(ctx, req.Query)
	if err != nil {
		return domain.SearchResponse{}, err
	}

	vectorRows, err := s.repo.VectorSearch(ctx, req.ProjectID, emb, topK*2)
	if err != nil {
		return domain.SearchResponse{}, err
	}
	keywordRows, err := s.repo.KeywordSearch(ctx, req.ProjectID, req.Query, topK*2)
	if err != nil {
		return domain.SearchResponse{}, err
	}

	merged := rrfMerge(vectorRows, keywordRows, topK)
	if s.enableRerank {
		merged = rerankByExactSignals(req.Query, merged)
	}

	if s.enableCache {
		_ = s.repo.SetCachedSearch(ctx, req.ProjectID, req.Query, topK, merged, s.cacheTTL)
	}

	return domain.SearchResponse{ProjectID: req.ProjectID, Query: req.Query, Results: merged}, nil
}

// GroundedSummary generates a concise answer from retrieved evidence only.
func (s *SearchService) GroundedSummary(ctx context.Context, user domain.UserContext, req domain.GroundedSummaryRequest) (domain.GroundedSummaryResponse, error) {
	searchResp, err := s.Search(ctx, user, domain.SearchRequest{
		ProjectID: req.ProjectID,
		Query: req.Query,
		TopK: req.TopK,
	})
	if err != nil {
		return domain.GroundedSummaryResponse{}, err
	}

	lines := make([]string, 0, len(searchResp.Results))
	seen := make(map[string]bool)
	sources := make([]domain.SourceRef, 0, len(searchResp.Results))
	for i, result := range searchResp.Results {
		if i >= 5 {
			break
		}
		lines = append(lines, fmt.Sprintf("- %s", result.Snippet))
		key := fmt.Sprintf("%s:%s", result.DocType, result.SourceID)
		if !seen[key] {
			sources = append(sources, domain.SourceRef{DocType: result.DocType, SourceID: result.SourceID})
			seen[key] = true
		}
	}

	summary := "No grounded evidence found for the query."
	if len(lines) > 0 {
		summary = strings.Join(lines, "\n")
	}

	return domain.GroundedSummaryResponse{
		ProjectID: req.ProjectID,
		Query: req.Query,
		Summary: summary,
		SourcesUsed: sources,
		Results: searchResp.Results,
	}, nil
}

func (s *SearchService) resolveTopK(requested int) int {
	topK := requested
	if topK <= 0 {
		topK = s.defaultK
	}
	if topK > s.maxResult {
		topK = s.maxResult
	}
	return topK
}

// rrfMerge combines vector and keyword rankings using Reciprocal Rank Fusion (RRF).
func rrfMerge(vectorRows, keywordRows []storage.SearchRow, topK int) []domain.SearchResult {
	type agg struct {
		row   storage.SearchRow
		score float64
	}
	m := make(map[string]*agg)

	for i, row := range vectorRows {
		key := row.ChunkID
		if m[key] == nil {
			m[key] = &agg{row: row}
		}
		m[key].score += 1.0 / (rrfK + float64(i+1))
	}
	for i, row := range keywordRows {
		key := row.ChunkID
		if m[key] == nil {
			m[key] = &agg{row: row}
		}
		m[key].score += 1.0 / (rrfK + float64(i+1))
	}

	out := make([]domain.SearchResult, 0, len(m))
	for _, v := range m {
		snippet := buildSnippet(v.row.Content)
		out = append(out, domain.SearchResult{
			DocType:    v.row.DocType,
			SourceID:   v.row.SourceID,
			Title:      v.row.Title,
			Snippet:    snippet,
			RankScore:  v.score,
			LinkRef:    fmt.Sprintf("/source/%s/%s", v.row.DocType, v.row.SourceID),
			ChunkID:    v.row.ChunkID,
			ProjectID:  v.row.ProjectID,
			Similarity: v.row.Similarity,
		})
	}

	sort.SliceStable(out, func(i, j int) bool {
		if out[i].RankScore == out[j].RankScore {
			if out[i].SourceID == out[j].SourceID {
				return out[i].ChunkID < out[j].ChunkID
			}
			return out[i].SourceID < out[j].SourceID
		}
		return out[i].RankScore > out[j].RankScore
	})
	if len(out) > topK {
		out = out[:topK]
	}
	return out
}

func buildSnippet(content string) string {
	if len(content) <= maxSnippetLength {
		return content
	}
	return content[:maxSnippetLength] + "..."
}

func rerankByExactSignals(query string, in []domain.SearchResult) []domain.SearchResult {
	lowerQuery := strings.ToLower(strings.TrimSpace(query))
	if lowerQuery == "" {
		return in
	}
	for idx := range in {
		title := strings.ToLower(in[idx].Title)
		snippet := strings.ToLower(in[idx].Snippet)
		if strings.Contains(title, lowerQuery) {
			in[idx].RankScore += 0.15
		}
		if strings.Contains(snippet, lowerQuery) {
			in[idx].RankScore += 0.10
		}
	}
	sort.SliceStable(in, func(i, j int) bool {
		if in[i].RankScore == in[j].RankScore {
			return in[i].SourceID < in[j].SourceID
		}
		return in[i].RankScore > in[j].RankScore
	})
	return in
}
