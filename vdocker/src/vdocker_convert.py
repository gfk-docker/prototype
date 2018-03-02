def vdocker_usage():
   log_print('''Usage:	vdocker convert IMAGE OVF_PATH

Convert a container image to OVF which is used to create virtual machines

Options:
      --os       OVF base operating system, value in ['busybox', 'centos', 'ubuntu', 'windows'], default is 'busybox'
      --size     size for the virtual machine disk that being created, e.g. '512M'
      --gateway  gateway ipv4 address for access to external network, e.g. '192.168.1.1'
      --ip       ipv4 address for vm instance, e.g. '192.168.1.101'
      --subnet-mask
                 subnet mask e.g. '255.255.255.0'
      --ttyd     enable ttyd and provide tty via web client at http://<ip>:<ttyd>
      --no-entry disable entry command
      --help    Print usage

Require:
      cat, cp, dd, docker, echo, grub2-install, losetup, mkdir, mkfs.ext4, mount, qemu-img tar, umount
''')

def vdocker_convert_build_run_script(config_filename):
   config = None
   with open(config_filename, 'r') as f:
      config = json.loads(f.read())
   lines = ['']
   config_sec = config.get('config', {})
   for env in config_sec.get('Env', []):
      lines.append('export {0}'.format(env))
   cmd = None
   cmd = config_sec.get('Cmd', None)
   if not cmd:
      cmd = config_sec.get('Entrypoint', None)
   if cmd:
      # convert cmd to string:
      # e.g. ["nginx", "-g", "daemon off;"] => "\"nginx\" \"-g\" \"daemon off\""
      # TODO redirect stdout, stderr, stdin
      # TODO launch monitor to watch the process
      lines.append(' '.join(list(map(lambda x: json.dumps(x), cmd))) + ' &')
   if len(lines) > 0:
      lines[-1] = lines[-1] + '>/tmp/stdout.log 2>/tmp/stderr.log'
   return '\n'.join(lines)

def vdocker_convert_act(image_name, vmdk_filename, ostype, disksize=None, options=None):
   tmpdir = os.path.join(exec_path, 'tmp', uuid.uuid4().hex)
   layersdir = os.path.join(tmpdir, 'layers')
   mountdir = os.path.join(tmpdir, 'root')
   imagetar = os.path.join(tmpdir, 'image.tar')
   imagedisk = os.path.join(tmpdir, 'disk.img')
   log_print('export docker image layers ...')
   subprocess.check_output('mkdir -p {0} 2>/dev/null'.format(tmpdir), shell=True)
   subprocess.check_output('docker save -o {0} {1} 2>/dev/null'.format(imagetar, image_name), shell=True)
   imagetar_size = os.path.getsize(imagetar)
   image_size = 0
   #if ostype == 'busybox':
   # 8M kernel, 4M busybox, 8M grub2, (1-0.9) disk index
   log_print('make temporary disk image with ext4 ...')
   if disksize:
      image_size = helper_sizeh2c(disksize)
   else:
      image_size = int((imagetar_size + (8 + 4 + 8)*1024*1024) / 0.9) + 1
   image_size += 50*1024*1024 # reserve 50MB for linux kernel, busybox and ttyd
   log_print('disk size = {0}'.format(image_size))
   subprocess.check_output('dd if=/dev/zero of={0} count=1 bs={1} 2>/dev/null'.format(imagedisk, image_size), shell=True)
   subprocess.check_output('echo y | mkfs.ext4 {0} 2>/dev/null'.format(imagedisk), shell=True)

   subprocess.check_output('mkdir -p {0} {1}'.format(layersdir, mountdir), shell=True)
   log_print('mount temporary disk image for writing ...')
   loopdev = subprocess.check_output('losetup -f --show {0} 2>/dev/null'.format(imagedisk), shell=True).decode('utf8').split('\n')[0]
   subprocess.check_output('mount {0} {1}'.format(loopdev, mountdir), shell=True)
   log_print('extract docker image layers into the temporary disk ...')
   subprocess.check_output('cd {1} && tar xf {0} 2>/dev/null'.format(imagetar, layersdir), shell=True)
   with open(os.path.join(layersdir, 'manifest.json'), 'r') as f:
      manifest = json.loads(f.read())
   manifest = manifest[0]
   for layerfile in manifest['Layers']:
      log_print('- {0}'.format(layerfile))
      subprocess.check_output('cd {1} && tar xf {0} 2>/dev/null'.format(os.path.join(layersdir, layerfile), mountdir), shell=True)
   log_print('copy Linux kernel and BusyBox ...')
   subprocess.check_output('mkdir -p {0}/boot {0}/sbin {0}/etc/init.d'.format(mountdir), shell=True)
   subprocess.check_output('cp {0}/images/busybox/busybox {1}/sbin/'.format(exec_path, mountdir), shell=True)
   subprocess.check_output('cp {0}/images/vmlinuz-4.14.0 {1}/boot/'.format(exec_path, mountdir), shell=True)

   ttyd_port = options.get('ttyd_port', None)
   if ttyd_port is not None:
      log_print('copy ttyd ...')
      subprocess.check_output('cp {0}/images/ttyd/ttyd {1}/sbin/'.format(exec_path, mountdir), shell=True)

   log_print('prepare auto-running script ...')
   subprocess.check_output('cd {0}/sbin && ln -s busybox init'.format(mountdir), shell=True)

   if options is None:
      options = {}
   network_ip = options.get('ip', '')
   network_subnet_mask = options.get('subnet_mask', '255.255.255.0')
   if network_ip:
      if network_ip == 'dhcp':
         network_ip = 'busybox ifconfig eth0 `busybox udhcpc | busybox grep -o "[0-9][0-9]*[.][0-9][0-9]*[.][0-9][0-9]*[.][0-9][0-9]*" | busybox sort -u` netmask {0} up'.format(network_subnet_mask)
      else:
         network_ip = 'busybox ifconfig eth0 {0} netmask {1} up'.format(network_ip, network_subnet_mask)
   network_gateway = options.get('gateway', '')
   if network_gateway:
      network_gateway = 'busybox ip route add default via {0} dev eth0'.format(network_gateway)

   no_entry_cmd = options.get('no_entry', None)
   subprocess.check_output('\n'.join([
      'cat > {0}/etc/init.d/rcS <<EOF'.format(mountdir),
      # mount file system
      'mkdir -p /proc /sys /tmp /dev',
      'mount proc /proc -t proc',
      'mount sys /sys -t sysfs',
      'mount tmp /tmp -t tmpfs',
      'mkdir -p /dev/pts',
      'mount devpts /dev/pts -t devpts',
      # config network
      'busybox ifconfig lo up',
      #'busybox ifconfig eth0 172.16.65.101 netmask 255.255.255.0 up',
      #'busybox ip route add default via 172.16.65.2 dev eth0',
      network_ip,
      network_gateway,
      # config ttyd
      'ttyd -p {0} busybox sh &'.format(ttyd_port) if ttyd_port is not None else '',
      # config run script from docker file
      vdocker_convert_build_run_script(os.path.join(layersdir, manifest['Config'])) if not no_entry_cmd else '',
      'busybox poweroff -f' if not no_entry_cmd else '',
      'EOF',
   ]), shell=True)
   subprocess.check_output('chmod 755 {0}/etc/init.d/rcS'.format(mountdir), shell=True)
   log_print('install bootloader ...')
   subprocess.check_output('grub2-install --root-directory={0} --no-floppy --force {1} 2>/dev/null'.format(mountdir, loopdev), shell=True)
   subprocess.check_output('cp {0}/images/grub.cfg {1}/boot/grub2/grub.cfg && sync'.format(exec_path, mountdir), shell=True)
   subprocess.check_output('\n'.join([
      'cat > {0}/boot/grub2/grub.cfg <<EOF'.format(mountdir),
      'set pager=1',
      'set timeout=5',
      'set tuned_params=""',
      'terminal_output console',
      'menuentry \'vDocker Engine Virtual Machine - BusyBox\' {',
      '\tlinux /boot/vmlinuz-4.14.0 root=/dev/sda rw',
      '}',
      'EOF',
   ]), shell=True)
   log_print('generate vmdk disk file ...')
   subprocess.check_output('qemu-img convert -f raw -O vmdk {0} {1} 2>/dev/null'.format(imagedisk, vmdk_filename), shell=True)
   #subprocess.check_output('', shell=True)
   log_print('clean up ...')
   subprocess.check_output('umount {0}'.format(mountdir), shell=True)
   subprocess.check_output('losetup -d {0}'.format(loopdev), shell=True)
   subprocess.check_output('rm -rf {0}'.format(tmpdir), shell=True)
   log_print('done.')

def vdocker_convert(args):
   if '--help' in args:
      vdocker_usage()
      return 1

   option_os = 'busybox'
   if '--os' in args:
      i = args.index('--os')
      option_os = args[i+1]
      args = args[:i] + args[i+2:]

   if '--size' in args:
      i = args.index('--size')
      option_size = args[i+1]
      args = args[:i] + args[i+2:]
   else:
      option_size = None

   options = {}
   if '--gateway' in args:
      i = args.index('--gateway')
      options['gateway'] = args[i+1]
      args = args[:i] + args[i+2:]
   if '--ip' in args:
      i = args.index('--ip')
      options['ip'] = args[i+1]
      args = args[:i] + args[i+2:]
   if '--subnet-mask' in args:
      i = args.index('--subnet-mask')
      options['subnet_mask'] = args[i+1]
      args = args[:i] + args[i+2:]
   if '--ttyd' in args:
      i = args.index('--ttyd')
      options['ttyd_port'] = args[i+1]
      args = args[:i] + args[i+2:]
   if '--no-entry' in args:
      i = args.index('--no-entry')
      options['no_entry'] = True
      args = args[:i] + args[i+1:]

   n = len(args) // 2
   for i in range(n):
      image_name = args[2*i]
      vmdk_filename = args[2*i+1]
      vdocker_convert_act(image_name, vmdk_filename, option_os, option_size, options)
   log_print(str(args))

subcommand_register('convert', vdocker_convert, desc='', group='')
