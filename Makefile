export GOOS=windows
export GOARCH=amd64
export CGO_ENABLED=0

build: bin/fscontrol-amd64.exe

bin/fscontrol-amd64.exe:
	@go build \
		-o ./bin/fscontrol-amd64.exe \
		cmd/fscontrol/main.go

test:
	@go test -v ./...


clean:
	rm -rf bin