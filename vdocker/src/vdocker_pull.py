def vdocker_pull_usage():
   log_print('''Usage:	vdocker pull

Pull a vmdk disk or a repository from a registry

Options:
      --help   Print usage
''')

def vdocker_pull(args):
   if '--help' in args:
      vdocker_pull_usage()
      return 1
   return 0

subcommand_register('pull', vdocker_pull, desc='', group='')
