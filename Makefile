.PHONY: build run test clean

build:
	@echo "Building project..."
	@go build -v ./... 2>&1 || echo "Build failed with exit code: $$?"

run:
	@echo "Running server..."
	@go run main.go

test:
	@echo "Running tests..."
	@go test -v ./...

clean:
	@echo "Cleaning..."
	@go clean