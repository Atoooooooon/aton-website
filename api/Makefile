.PHONY: help run build test clean dev lint format

# Default target
help:
	@echo "Available commands:"
	@echo "  make run      - Run the server"
	@echo "  make build    - Build the binary"
	@echo "  make test     - Run tests"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make dev      - Run with hot reload (requires air)"
	@echo "  make lint     - Run linter"
	@echo "  make format   - Format code"

# Run the server
run:
	@echo "Starting server..."
	@go run cmd/server/main.go

# Build the binary
build:
	@echo "Building server..."
	@go build -o bin/server cmd/server/main.go
	@echo "Build complete: bin/server"

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@go clean
	@echo "Clean complete"

# Run with hot reload (requires github.com/cosmtrek/air)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Falling back to 'go run'..."; \
		go run cmd/server/main.go; \
	fi

# Run linter
lint:
	@echo "Running linter..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install from https://golangci-lint.run/usage/install/"; \
	fi

# Format code
format:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "Format complete"
