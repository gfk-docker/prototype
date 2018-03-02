def main(args):
   if len(args) == 0:
      subcommand = '--help'
   else:
      subcommand = args[0]
   if subcommand in subcommands:
      return subcommands[subcommand]['entry'](args[1:])
   log_print('docker: \'{0}\' is not a vdocker command.'.format(subcommand))
   log_print('See \'vdocker --help\'')

if __name__ == '__main__':
   main(sys.argv[1:])
