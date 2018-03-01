from tornado import websocket, web, ioloop
import json
import subprocess
from tfcompile import NeuralNetworkGenerator

class IndexHandler(web.RequestHandler):
    def get(self):
        self.render("../client/index.html")

class StaticHandler(web.RequestHandler):
    def get(self, filename):
        self.render("../client/{}".format(filename))

class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        pass

    def on_message(self, message):
        pass

    def on_close(self):
        pass

class ApiHandler(web.RequestHandler):

    @web.asynchronous
    def get(self, *args):
        self.finish()

    @web.asynchronous
    def post(self):
        params = json.loads(self.request.body)
        print(params)
        gen = NeuralNetworkGenerator()
        gen.generate(
            'test.py',
            params['input'],
            ['x1', 'x2'],
            map(lambda x: x['neurons'], params['hidden']),
            params['hidden'][0]['activation'],
            float(params['hidden'][0]['lrate']),
            200,
            20000
        )
        txt = subprocess.check_output('python test.py', shell=True)
        self.write(json.dumps(txt.split('\n')))
        self.finish()

app = web.Application([
    (r'/', IndexHandler),
    (r'/ws', SocketHandler),
    (r'/api', ApiHandler),
    (r'/(pipeline.js)', StaticHandler),
    (r'/(svg.min.js)', StaticHandler),
    (r'/(bootstrap.min.css)', StaticHandler),
])

if __name__ == '__main__':
    app.listen(9090)
    ioloop.IOLoop.instance().start()
