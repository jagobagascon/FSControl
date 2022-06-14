package cli

import (
	"context"
	"flag"
	"log"

	"github.com/jagobagascon/FSControl/internal/server"
	"github.com/peterbourgon/ff/v3"
	"github.com/peterbourgon/ff/v3/ffcli"
)

// NewServerCommand returns a new command for starting the server.
func NewServerCommand() *ffcli.Command {
	fs := flag.NewFlagSet("fscontrol", flag.ExitOnError)

	cfg := server.NewConfig()

	fs.BoolVar(&cfg.Dev, "dev", cfg.Dev, "This mode lets the server serve files from the disk instead of the embed content to simplify development.")
	fs.StringVar(&cfg.Address, "address", cfg.Address, "The address where the static files will be served.")

	return &ffcli.Command{
		Name:       fs.Name(),
		ShortUsage: fs.Name(),
		ShortHelp:  "Serves an HTML application with controls to interact with MS Flight Simulator 2020 game.",
		FlagSet:    fs,
		Options:    []ff.Option{ff.WithConfigFileFlag("config")},
		Exec: func(ctx context.Context, args []string) error {
			srv := server.NewServer(&server.Config{
				Dev:     cfg.Dev,
				Address: cfg.Address,
			})
			log.Println("fscontrol server started")
			return srv.Run()
		},
	}
}
