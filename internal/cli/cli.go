package cli

import (
	"context"
	"flag"
	"log"

	"github.com/jagobagascon/FSControl/internal/server"
	"github.com/peterbourgon/ff/v3"
	"github.com/peterbourgon/ff/v3/ffcli"
)

func NewServerCommand() *ffcli.Command {
	fs := flag.NewFlagSet("fscontrol", flag.ExitOnError)

	return &ffcli.Command{
		Name:       fs.Name(),
		ShortUsage: fs.Name(),
		ShortHelp:  "Starts a new",
		LongHelp:   "",
		FlagSet:    fs,
		Options:    []ff.Option{ff.WithConfigFileFlag("config")},
		Exec: func(ctx context.Context, args []string) error {
			srv := server.NewServer(&server.Config{
				Dev: true,
			})
			log.Println("fscontrol server started")
			return srv.Run()
		},
	}
}
