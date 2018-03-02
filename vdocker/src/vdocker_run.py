def vdocker_build_usage():
   log_print('''Usage:	vdocker run

Run a command in a new virtual machine

Options:
      --help   Print usage
''')

def vdocker_run(args):
   if '--help' in args:
      vdocker_run_usage()
      return 1
   return 0

subcommand_register('run', vdocker_run, desc='', group='')
