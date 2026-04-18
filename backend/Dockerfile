FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/server ./server
EXPOSE 8081
CMD ["./server"]
