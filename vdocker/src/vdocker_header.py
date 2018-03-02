import os
import sys
import subprocess
import uuid
import json

exec_path = os.path.realpath(os.path.dirname(sys.argv[0]) or '.')

def log_print(m, **kwarg):
   sys.stdout.write(m)
   sys.stdout.write('\n')

def log_printf(m, *args, **kwargs):
   sys.stdout.write(m.format(*args))

def verboselize_check_output():
   def new_check_output(cmd, *args, **kwargs):
      log_print('cmd: {0}'.format(cmd))
      return origin_check_output(cmd, *args, **kwargs)
   origin_check_output = subprocess.check_output
   subprocess.check_output = new_check_output

def helper_sizeh2c(sizestr):
   sizestr = str(sizestr)
   if not sizestr:
      return 0
   base = 1
   last = sizestr[-1].lower()
   if last == 'k':
      base = 1024
      sizestr = sizestr[:-1]
   elif last == 'm':
      base = 1024*1204
      sizestr = sizestr[:-1]
   elif last == 'g':
      base = 1024*1024*1024
      sizestr = sizestr[:-1]
   try:
      return int(sizestr) * base
   except:
      return 0

subcommands = {}

def subcommand_register(name, entry, desc=None, group=None, alias=None):
   subcommands[name] = {
      "name": name,
      "alias": alias,
      "group": group,
      "desc": desc,
      "entry": entry,
   }

if os.environ.get('DEBUG'):
   verboselize_check_output()
