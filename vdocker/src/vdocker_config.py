def vdocker_config_usage():
   log_print('''Usage:	vdocker config

Configure vDocker system environment

Options:
      --help   Print usage
''')

def vdocker_config(args):
   if '--help' in args:
      vdocker_config_usage()
      return 1
   return 0

subcommand_register('config', vdocker_config, desc='', group='')
