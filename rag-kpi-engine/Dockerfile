FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download || true
COPY . .
RUN go mod tidy
RUN go build -o rag-engine ./cmd/server

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache postgresql-client
COPY --from=build /app/rag-engine ./rag-engine
COPY migrations ./migrations
COPY scripts/migrate.sh ./scripts/migrate.sh
RUN sed -i 's/\r$//' ./scripts/migrate.sh && chmod +x ./scripts/migrate.sh
EXPOSE 8085
CMD ["/bin/sh", "-c", "sh ./scripts/migrate.sh && ./rag-engine"]
