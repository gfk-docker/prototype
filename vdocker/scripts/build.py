#!/usr/bin/env python
import os
import sys
import subprocess

def read_file(path, filename):
   with open(os.path.join(path, filename), 'r') as f:
      return f.read()

path = os.path.realpath(os.path.dirname(sys.argv[0]) or '.')
if os.path.isdir(os.path.join(path, 'src')):
   srcpath = os.path.realpath(os.path.join(path, 'src'))
elif os.path.isdir(os.path.join(path, '..', 'src')):
   srcpath = os.path.realpath(os.path.join(path, '..', 'src'))
else:
   raise Exception('cannot find vDocker source files ...')
pyfiles = subprocess.check_output(
   'cd {0} && find . -type f -name "*.py"'.format(srcpath).encode('utf8'), shell=True
).decode('utf8').split('\n')
print (pyfiles)

headers = [
   './vdocker_header.py',
   './vdocker_help.py',
   './vdocker_check.py',
]
footers = [
   './vdocker_footer.py',
]
exceptions = [
   '',
]

print('concat files into vdocker_debug.py ...')
with open(os.path.join(srcpath, '..', 'vdocker_debug.py'), 'w+') as output:
   print('[header]')
   for filename in headers:
      print('- {0}'.format(filename))
      output.write(read_file(srcpath, filename))
      output.write('\n')
   body = set(pyfiles)
   #print(body)
   for filename in headers + footers + exceptions:
      body.remove(filename)
   print('[component]')
   for filename in body:
      print('- {0}'.format(filename))
      output.write(read_file(srcpath, filename))
      output.write('\n')
   print('[footer]')
   for filename in footers:
      print('- {0}'.format(filename))
      output.write(read_file(srcpath, filename))
      output.write('\n')

print('vdocker built successfully.')
