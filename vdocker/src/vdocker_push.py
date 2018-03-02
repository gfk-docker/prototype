def vdocker_push_usage():
   log_print('''Usage:	vdocker push

Push a vmdk disk or a repository to a registry

Options:
      --help   Print usage
''')

def vdocker_push(args):
   if '--help' in args:
      vdocker_push_usage()
      return 1
   return 0

subcommand_register('push', vdocker_push, desc='', group='')
