export GOOS=windows
export GOARCH=amd64
export CGO_ENABLED=0

.PHONY: sanity-check
sanity-check:
	@golangci-lint run ./... --timeout 30m -v


.PHONY: build
build: bin/fscontrol-amd64.exe

.PHONY: test
test:
	@go test -v ./...

.PHONY: clean
clean:
	@rm -rf bin

bin/fscontrol-amd64.exe:
	@go build \
		-o ./bin/fscontrol-amd64.exe \
		cmd/fscontrol/main.go
