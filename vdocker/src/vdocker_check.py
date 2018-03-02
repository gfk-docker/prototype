def vdocker_check_env_cmd_(cmd):
   try:
      p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
      p.communicate()
      return True
   except:
      return False

def vdocker_check_env_cmd(check_desc, cmd, required=True, cache=None):
   log_printf('checking {0} ... '.format(check_desc))
   if vdocker_check_env_cmd_(cmd):
      if isinstance(cache, dict): cache[check_desc] = True
      log_print('ok')
      return True
   else:
      log_print('no')
      if isinstance(cache, dict): cache[check_desc] = False
      if required:
         raise Exception('! failed on checking {0}'.format(check_desc))
      return False

def vdocker_check_component(check_desc, deps, answers):
   log_printf('checking component {0} ...'.format(check_desc))
   for dep in deps:
      if not answers.get(dep, None):
         answers[check_desc] = False
         log_print('no')
         return False
   answers[check_desc] = True
   log_print('ok')
   return True

def vdocker_check_env():
   answers = {}
   vdocker_check_env_cmd('find', 'find --version', required=False, cache=answers)
   # vdocker convert
   vdocker_check_env_cmd('echo', 'echo --version', required=False, cache=answers)
   vdocker_check_env_cmd('cp', 'cp --version', required=False, cache=answers)
   vdocker_check_env_cmd('cat', 'cat --version', required=False, cache=answers)
   vdocker_check_env_cmd('dd', 'cat --version', required=False, cache=answers)
   vdocker_check_env_cmd('mkdir', 'mkdir --version', required=False, cache=answers)
   vdocker_check_env_cmd('umount', 'umount --version', required=False, cache=answers)
   vdocker_check_env_cmd('mount', 'mount --version', required=False, cache=answers)
   vdocker_check_env_cmd('tar', 'tar --version', required=False, cache=answers)
   vdocker_check_env_cmd('losetup', 'losetup --version', required=False, cache=answers)
   vdocker_check_env_cmd('mkfs.ext4', 'mkfs.ext4 --version', required=False, cache=answers)
   vdocker_check_env_cmd('grub2-install', 'grub2-install --version', required=False, cache=answers)
   vdocker_check_env_cmd('qemu-img', 'qemu-img --version', required=False, cache=answers)
   vdocker_check_env_cmd('docker', 'docker version', required=False, cache=answers)
   vdocker_check_component('vdocker.convert', [
      'echo', 'cp', 'cat', 'dd', 'mkdir', 'umount', 'mount', 'tar',
      'losetup', 'mkfs.ext4', 'grub2-install', 'qemu-img', 'docker'
   ], answers)
   log_print('done.')

def vdocker_check_usage():
   log_print('''Usage:	vdocker check

Check requirements are satisfied to run vdocker

Options:
      --help   Print usage
''')

def vdocker_check(args):
   if '--help' in args:
      vdocker_check_usage()
      return 1
   vdocker_check_env()
   return 0

subcommand_register('check', vdocker_check, desc='', group='')
