package embedding

import "context"

// Provider represents an embedding service implementation.
type Provider interface {
	Embed(ctx context.Context, text string) ([]float32, error)
}
