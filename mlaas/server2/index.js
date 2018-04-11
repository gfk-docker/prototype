const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const i_utils = require('./utils');
const i_master = require('./master');

const database_filename = path.join(__dirname, 'database.json');
const database = {
   api: {
      addTask: (task_item) => {
         if (task_item.configure && !task_item.configure.host) {
            task_item.configure.host = '1';
         }
         if (!task_item.progress) task_item.progress = {};
         task_item.progress.count = parseInt(task_item.configure.host);
         if (task_item.id) {
            let obj = database.task.filter(function (item) {
               return item.id === task_item.id;
            })[0];
            Object.assign(obj, task_item);
            return;
         }
         task_item.id = database.task_id++;
         task_item.status = 'new';
         database.task.push(task_item);
      },
      addMachine: (machine_item) => {
         database.machine.push(machine_item);
      }
   },
   task_id: 1,
   task: [],
   machine: [],
   machine_task: {}
};
if (fs.existsSync(database_filename)) {
   Object.assign(database, JSON.parse(fs.readFileSync(database_filename)));
}

function get_ip (req) {
   let ip = null;
   if (req.headers['x-forwarded-for']) {
      ip = req.headers['x-forwarded-for'].split(",")[0];
   } else if (req.connection && req.connection.remoteAddress) {
      ip = req.connection.remoteAddress;
   } else {
      ip = req.ip;
   }
   return ip;
}

function route(req, res) {
   let r = url.parse(req.url);
   let f = router;
   let path = r.pathname.split('/');
   let query = {};
   r.query && r.query.split('&').forEach((one) => {
      let key, val;
      let i = one.indexOf('=');
      if (i < 0) {
         key = one;
         val = '';
      } else {
         key = one.substring(0, i);
         val = one.substring(i+1);
      }
      if (key in query) {
         if(Array.isArray(query[key])) {
            query[key].push(val);
         } else {
            query[key] = [query[key], val];
         }
      } else {
         query[key] = val;
      }
   });
   path.shift();
   while (path.length > 0) {
      let key = path.shift();
      f = f[key];
      if (!f) break;
      if (typeof(f) === 'function') {
         return f(req, res, {
            path: path,
            query: query
         });
      }
   }
   router.static(req, res, r.pathname);
   // router.code(req, res, 404, 'Not Found');
}

const static_cache = {};
const router = {
   authenticate: (req, res, options) => {
      if (req.method !== 'POST') {
         return router.code(req, res, 404, 'Not Found');
      }
      res.setHeader('Content-Type', 'application/json');
      res.end('true');
   },
   login: (req, res, options) => {
      res.setHeader('Content-Type', 'application/json');
      res.end('true');
   },
   task: (req, res, options) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'POST') {
         // create
         let body = [];
         req.on('data', (chunk) => {
            body.push(chunk);
         }) .on('end', () => {
            body = JSON.parse(Buffer.concat(body).toString());
            database.api.addTask(body);
            res.end(JSON.stringify({ id: body.id, status: body.status }));
         });
      } else if (options.path.length) {
         // get one
         let id = parseInt(options.path[0]);
         let one = database.task.filter((item) => item.id === id)[0];
         if (one) {
            res.end(JSON.stringify(one));
         } else {
            return router.code(req, res, 404, 'Not Found');
         }
      } else {
         // get all
         res.end(JSON.stringify(database.task));
      }
   },
   machine: (req, res, options) => {
      let host = options.path[0]; // e.g. 10.111.113.101:20180
      database.api.addMachine({host: host});
      res.end('ok');
   },
   database: {
      presist: (req, res, options) => {
         fs.writeFileSync(database_filename, JSON.stringify({
            task_id: database.task_id,
            task: database.task,
            machine: database.machine,
            machine_task: {}
         }));
         res.end('ok');
      }
   },
   test: (req, res, options) => {
      res.end('hello');
   },
   static: (req, res, filename) => {
      if (!filename || filename === '/') {
         filename = 'index.html';
      }
      filename = filename.split('/');
      if (!filename[0]) filename.shift();
      if (filename.length === 0 || filename.indexOf('..') >= 0) {
         return router.code(req, res, 404, 'Not Found');
      }
      filename = path.join(__dirname, '..', 'client', ...filename);
      let buf = static_cache[filename];
      if (!buf) {
         if (!fs.existsSync(filename)) {
            return router.code(req, res, 404, 'Not Found');
         }
         buf = fs.readFileSync(filename);
         static_cache[filename] = buf;
      }
      res.setHeader('Content-Type', i_utils.Mime.lookup(filename));
      res.end(buf, 'binary');
   },
   code: (req, res, code, text) => {
      res.writeHead(code || 404, text || '');
      res.end();
   }
};

i_master.start(database);

const server = http.createServer((req, res) => {
   route(req, res);
});

const server_port = 9090;
const server_host = '127.0.0.1';

const instance = server.listen(server_port, server_host, () => {
   console.log(`Machine Learning as a Service is listening at ${server_host}:${server_port}`);
});
