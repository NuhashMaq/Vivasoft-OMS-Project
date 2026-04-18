package chunk

import "testing"

func TestChunkBuild(t *testing.T) {
	c := New(40, 80)
	text := ""
	for i := 0; i < 250; i++ {
		text += "word "
	}
	chunks := c.Build("title", text)
	if len(chunks) < 3 {
		t.Fatalf("expected multiple chunks, got %d", len(chunks))
	}
}
