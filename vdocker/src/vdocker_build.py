def vdocker_build_usage():
   log_print('''Usage:	vdocker build [--from-docker [Dockerfile]] [--from-vmdk [Vmdkfile]]

Build a vmdk disk from a Dockerfile

Options:
      --help   Print usage
''')

def vdocker_build(args):
   if '--help' in args:
      vdocker_build_usage()
      return 1
   return 0

subcommand_register('build', vdocker_build, desc='', group='')
