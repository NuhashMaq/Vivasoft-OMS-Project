package embedding

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"
)

const defaultHFTimeoutSeconds = 30

type HF struct {
	tok   string
	model string
	cli   *http.Client
	dim   int
	norm  bool
}

type hfHTTPError struct {
	status int
	body   string
}

func (e *hfHTTPError) Error() string {
	return fmt.Sprintf("huggingface api error: status=%d body=%s", e.status, e.body)
}

func NewHF(tok, model string, dim, timeoutSec int, norm bool) *HF {
	if timeoutSec <= 0 {
		timeoutSec = defaultHFTimeoutSeconds
	}
	if model == "" {
		model = "sentence-transformers/all-MiniLM-L6-v2"
	}
	return &HF{
		tok:   tok,
		model: model,
		dim:   dim,
		norm:  norm,
		cli:   &http.Client{Timeout: time.Duration(timeoutSec) * time.Second},
	}
}

func (h *HF) Embed(ctx context.Context, text string) ([]float32, error) {
	text = strings.TrimSpace(text)
	if text == "" {
		return make([]float32, h.dim), nil
	}

	urls := []string{
		fmt.Sprintf("https://router.huggingface.co/hf-inference/models/%s", h.model),
		fmt.Sprintf("https://api-inference.huggingface.co/models/%s", h.model),
		fmt.Sprintf("https://api-inference.huggingface.co/pipeline/feature-extraction/%s", h.model),
	}

	var lastErr error
	for _, url := range urls {
		vec, err := h.embedWithURL(ctx, url, text)
		if err == nil {
			return vec, nil
		}
		lastErr = err
		hfErr := &hfHTTPError{}
		if errors.As(err, &hfErr) && hfErr.status == http.StatusNotFound {
			continue
		}
		if errors.As(err, &hfErr) && hfErr.status == http.StatusBadRequest {
			continue
		}
		break
	}

	var hfErr *hfHTTPError
	if errors.As(lastErr, &hfErr) {
		if hfErr.status == http.StatusUnauthorized || hfErr.status == http.StatusForbidden {
			return make([]float32, h.dim), nil
		}
	}

	return nil, lastErr
}

func (h *HF) embedWithURL(ctx context.Context, url, text string) ([]float32, error) {
	body, err := json.Marshal(map[string]any{
		"inputs": text,
		"options": map[string]any{
			"wait_for_model": true,
		},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(h.tok) != "" {
		req.Header.Set("Authorization", "Bearer "+h.tok)
	}

	resp, err := h.cli.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, &hfHTTPError{status: resp.StatusCode, body: string(raw)}
	}

	vec, err := parseVec(raw)
	if err != nil {
		return nil, err
	}
	vec = resize(vec, h.dim)
	if h.norm {
		vec = l2(vec)
	}
	return vec, nil
}

func parseVec(raw []byte) ([]float32, error) {
	var one []float64
	if err := json.Unmarshal(raw, &one); err == nil && len(one) > 0 {
		return toF32(one), nil
	}

	var two [][]float64
	if err := json.Unmarshal(raw, &two); err == nil && len(two) > 0 {
		return pool(two), nil
	}

	var er map[string]any
	if err := json.Unmarshal(raw, &er); err == nil {
		if msg, ok := er["error"].(string); ok && msg != "" {
			return nil, fmt.Errorf("huggingface response error: %s", msg)
		}
	}

	return nil, fmt.Errorf("unable to parse huggingface embedding response")
}

func toF32(in []float64) []float32 {
	out := make([]float32, len(in))
	for i := range in {
		out[i] = float32(in[i])
	}
	return out
}

func pool(in [][]float64) []float32 {
	if len(in) == 0 || len(in[0]) == 0 {
		return nil
	}
	dim := len(in[0])
	out := make([]float32, dim)
	for _, row := range in {
		if len(row) != dim {
			continue
		}
		for i := 0; i < dim; i++ {
			out[i] += float32(row[i])
		}
	}
	den := float32(len(in))
	if den == 0 {
		return out
	}
	for i := range out {
		out[i] = out[i] / den
	}
	return out
}

func resize(in []float32, dim int) []float32 {
	if dim <= 0 {
		return in
	}
	out := make([]float32, dim)
	copy(out, in)
	return out
}

func l2(vec []float32) []float32 {
	var norm float64
	for i := range vec {
		norm += float64(vec[i] * vec[i])
	}
	if norm == 0 {
		return vec
	}
	norm = math.Sqrt(norm)
	for i := range vec {
		vec[i] = float32(float64(vec[i]) / norm)
	}
	return vec
}
