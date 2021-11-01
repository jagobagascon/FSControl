OS ?= windows
ARCH ?= 386 amd64

build:
	for os in $(OS); do \
		for arch in $(ARCH); do \
			ext=""; \
			if [ "$${os}" == "windows" ]; then \
				ext=".exe"; \
			fi; \
			GOOS=$${os} GOARCH=$${arch} CGO_ENABLED=0 \
			go build \
				-o ./bin/fscontrol-$${os}-$${arch}$${ext} \
				cmd/fscontrol/main.go; \
		done; \
	done
