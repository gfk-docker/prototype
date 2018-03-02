def vdocker_daemon_usage():
   log_print('''Usage:	vdocker daemon

vDocker daemon to expose Docker API for external service

Options:
      --help   Print usage
''')

def vdocker_daemon(args):
   if '--help' in args:
      vdocker_daemon_usage()
      return 1
   return 0

subcommand_register('daemon', vdocker_daemon, desc='', group='')
