package chunk

import "strings"

const minOverlapWords = 15

// Chunker splits source text into bounded, overlapping chunks for retrieval quality.
type Chunker struct {
	minWords int
	maxWords int
}

// New creates a chunker with configurable min/max chunk sizes.
func New(minWords, maxWords int) *Chunker {
	return &Chunker{minWords: minWords, maxWords: maxWords}
}

// Build combines title + content and returns retrieval-ready chunks.
func (c *Chunker) Build(title, content string) []string {
	text := strings.TrimSpace(strings.Join([]string{title, content}, "\n"))
	if text == "" {
		return nil
	}

	words := strings.Fields(text)
	if len(words) <= c.maxWords {
		return []string{text}
	}

	var chunks []string
	start := 0
	overlap := c.overlapWords()

	for start < len(words) {
		end := start + c.maxWords
		if end > len(words) {
			end = len(words)
		}
		chunks = append(chunks, strings.Join(words[start:end], " "))
		if end == len(words) {
			break
		}
		start = max(0, end-overlap)
	}
	return chunks
}

func (c *Chunker) overlapWords() int {
	overlap := c.minWords / 3
	if overlap < minOverlapWords {
		return minOverlapWords
	}
	return overlap
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
