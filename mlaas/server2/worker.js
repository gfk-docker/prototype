const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const WebSocket = require('ws');

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
   router.code(req, res, 404, 'Not Found');
}

const router = {
   test: (req, res, options) => {
      res.end('hello');
   },
   code: (req, res, code, text) => {
      res.writeHead(code || 404, text || '');
      res.end();
   }
};

const server = http.createServer((req, res) => {
   route(req, res);
});
const wsserver = new WebSocket.Server({ server, path: '/ws' });

wsserver.on('connection', (ws, req) => {
   let running = null;
   ws.on('message', (m) => {
      try {
         m = JSON.parse(m);
         switch(m.cmd) {
            case 'exec':
            if (running) return;
            if (m.file) {
               fs.writeFileSync(m.file.name, m.file.text);
            }
            let p = exec(m.value);
            running = {process: p};
            p.stdout.on('data', (data) => {
               ws.send(JSON.stringify({
                  data: data
               }));
            });
            p.on('exit', (code) => {
               ws.send(JSON.stringify({
                  cmd: 'exit',
                  code: code
               }));
               running = null;
            })
            break;
         }
      } catch (e) {}
   });
});

const server_port = 20180;
const server_host = '0.0.0.0';

const instance = server.listen(server_port, server_host, () => {
   console.log(`Machine Learning Worker is listening at ${server_host}:${server_port}`);
});
