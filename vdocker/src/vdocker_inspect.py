def vdocker_inspect_usage():
   log_print('''Usage:	vdocker inspect

Return low-level information on vDocker objects

Options:
      --help   Print usage
''')

def vdocker_inspect(args):
   if '--help' in args:
      vdocker_inspect_usage()
      return 1
   return 0

subcommand_register('inspect', vdocker_inspect, desc='', group='')
