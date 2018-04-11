const i_ws = require('ws');

const env = {};

function random(n) {
   return ~~(Math.random()*n);
}

function start(database) {
   env.database = database;
   setInterval(task_scheduler, 2000);
}

function task_scheduler() {
   let machines = env.database.machine.filter((x, i) => !env.database.machine_task[i]);
   // no available machine
   if (!machines.length) return;
   let tasks = env.database.task.filter((x) => x.status !== 'new' && x.progress && x.progress.count > 0);
   if (!tasks.length) return;
   process(tasks[random(tasks.length)], machines[0]);
}

function process(task, machine) {
   if (task.progress.count === parseInt(task.configure.host)) {
      task.progress.logs = [];
      for(let i = task.progress.count; i > 0; i--) {
         task.progress.logs.push({ status: 'queued', output: '' });
      }
   }
   let machine_index = env.database.machine.indexOf(machine);
   if (machine_index < 0) return;
   task.progress.count --;
   var log_obj = task.progress.logs[task.configure.host - task.progress.count - 1];
   var hostname = machine.host.split(':')[0];
   let wsclient = new i_ws(`ws://${machine.host}/ws`);
   env.database.machine_task[machine_index] = {
      task_id: task.id,
      wsclient: wsclient
   };
   task.status = 'running'; // provision
   log_obj.status = 'running'; // provision
   wsclient.on('open', () => {
      log_obj.output = 'worker: ' + hostname + '\n';
      log_obj.output += 'starting: ' + new Date().toISOString() + '\n';
      wsclient.send(JSON.stringify({
         cmd: 'exec',
         file: {
            name: '/tmp/test.py',
            text: task.algorithm.text
         },
         value: 'python /tmp/test.py'
      }));
      task.status = 'running';
      log_obj.status = 'running';
   });
   wsclient.on('message', (m) => {
      m = JSON.parse(m);
      if (m.cmd === 'exit') {
         if (m.code) {
            log_obj.status = 'failed';
            log_obj.code = m.code;
         } else {
            log_obj.status = 'success';
         }
         log_obj.output += '\nended: ' + new Date().toISOString();
         if (task.progress.logs.filter((x) => ['failed', 'success'].indexOf(x.status) < 0).length === 0) {
            var rate = task.progress.logs.filter((x) => x.status === 'success').length / task.progress.logs.length;
            if (rate >= 0.5) task.status = 'success'; else task.status = 'failed';
            task.has_report = true;
         }
         delete env.database.machine_task[machine_index];
         wsclient.close();
      } else if (m.data !== undefined) {
         if (!log_obj.output) log_obj.output = '';
         log_obj.output += m.data;
      }
   });
}

module.exports = {
   start
};