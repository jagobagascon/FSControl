package main

import (
	"context"
	"log"
	"os"

	"github.com/jagobagascon/FSControl/internal/cli"
)

func main() {
	serveCmd := cli.NewServerCommand()

	if err := serveCmd.ParseAndRun(context.Background(), os.Args[1:]); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}
