"""
state {
  * activation: "relu", "tanh", "sigmoid", "linear",
  * batchSize
    collectStats
  * dataset
    percTrainData
    discretize
    initZero
  * learningRate
    numHiddenLayers
  * networkShape []
    noise
    problem
    regularization
    regularizationRate
    seed
    showTestData
    tutorial

    x
    y
    sinX
    sinY
    cosX
    cosY
    xSquared
    ySquared
    xSquared
}
"""

import json
import random

import numpy as np
import tensorflow as tf

TF_CODE="""# -*- coding: utf-8 -*-
import json
import math
import random
import numpy as np
import tensorflow as tf

def load_json_file(filename):
    with open(filename, 'r') as f:
        return json.loads(f.read())

def feature(name):
    if name == 'x1':
        return lambda vec: vec[0]
    elif name == 'x2':
        return lambda vec: vec[1]
    elif name == 'x1^2':
        return lambda vec: vec[0]*vec[0]
    elif name == 'x2^2':
        return lambda vec: vec[1]*vec[1]
    elif name == 'x1x2':
        return lambda vec: vec[0]*vec[1]
    elif name == 'sinx1':
        return lambda vec: math.sin(vec[0])
    elif name == 'sinx2':
        return lambda vec: math.sin(vec[1])

def transform(train_data, feature_list):
    # feature_list: x1, x2, x1^2, x2^2, x1x2, sinx1, sinx2
    feature_list = list(map(lambda x: feature(x), feature_list))
    train_data_ = []
    for one in train_data:
        tron = []
        for f in feature_list:
            tron.append(f(one))
        train_data_.append(tron)
    return train_data_

def activate(name):
    if name == 'sigmoid':
        return tf.sigmoid
    elif name == 'tanh':
        return tf.tanh
    elif name == 'relu':
        return lambda x: x if x > 0 else 0
    else:
        return lambda x: x

def debug(session, i, input, train_input, target, train_target, hypothesis, hidden_layers, cross_entropy, train_feature):
    print("Epoch %i" % i)
    print("- Hypothesis %s" % session.run(
        hypothesis, feed_dict={{input: train_input, target: train_target}}
    ))
    for index, layer in enumerate(hidden_layers):
        print("   - w%i=%s, b%i=%s" % (
            index, session.run(layer[0]),
            index, session.run(layer[1])
        ))
    print("   - cost (ce)=%s" % session.run(
        cross_entropy, feed_dict={{input: train_input, target: train_target}}
    ))

    print("- Boundry")
    ch = []
    xs = np.linspace(-5, 5)
    ys = np.linspace(-5, 5)
    for x in xs:
        for y in ys:
            p = session.run(hypothesis, feed_dict={{input: transform([[x, y]], train_feature)}})
            p = p.argmax()
            if p == 0:
                ch.append('.')
            else:
                ch.append('x')
            if y == 5.0:
                print(' %s' % ''.join(ch))
                ch = []

def main():
    data = load_json_file({})
    train_input = data['input']
    train_target = data['target']
    train_feature = {}
    train_input = transform(train_input, train_feature)

    nb_classes = 2
    input_vec_size = len(train_input[0])
    input = tf.placeholder(
        tf.float32,
        shape=[None, input_vec_size],
        name="input"
    )
    target = tf.placeholder(
        tf.float32,
        shape=[None, nb_classes],
        name="target"
    )

    layers = {}
    hidden_layers = [] # one: [w, b, activation]
    activate_fn = activate('{}')
    last_input = input
    last_size = input_vec_size
    for i, next_size in enumerate(layers):
        w = tf.Variable(
            tf.random_uniform([last_size, next_size], -1, 1, name="w%i" % i)
        )
        b = tf.Variable(
            tf.zeros([next_size], name="b%i" % i)
        )
        hidden_layers.append(
            [w, b, activate_fn(tf.matmul(last_input, w) + b)]
        )
        last_size = next_size
        last_input = hidden_layers[-1][2]

    wout = tf.Variable(
        tf.random_uniform([last_size, nb_classes], -1, 1, name="wout")
    )
    bout = tf.Variable(
        tf.zeros([nb_classes], name="bout")
    )
    hypothesis = tf.nn.softmax(
        tf.matmul(last_input, wout) + bout
    )
    cross_entropy = -tf.reduce_sum(target*tf.log(hypothesis))
    train_step = tf.train.GradientDescentOptimizer({}).minimize(cross_entropy)

    init = tf.global_variables_initializer()
    session = tf.Session()
    session.run(init)
    batch_size = {}
    train_input_size = len(train_input)
    for i in range({}):
        batch_index = random.sample(range(train_input_size), batch_size)
        batch_input = list(map(lambda x: train_input[x], batch_index))
        batch_target = list(map(lambda x: train_target[x], batch_index))
        session.run(train_step, feed_dict={{input: batch_input, target: batch_target}})
        if i % 5000 == 4999:
            debug(session, i, input, train_input, target, train_target, hypothesis, hidden_layers, cross_entropy, train_feature)

if __name__ == '__main__':
    main()
"""
# .format(
#     train_input,
#     train_output,
#     hidden_layer_def e.g. [2,3,4],
#     activate_name,
#     learning_rate,
#     batch_size,
#     iter
# )

def sample_xor(size):
    input = []
    target = []
    for _ in range(size):
        x1 = 5*(random.random()*2-1)
        x2 = 5*(random.random()*2-1)
        if x1 > 0 and x2 > 0:
            c = 0
        elif x1 < 0 and x2 < 0:
            c = 0
        elif x1 > 0 and x2 < 0:
            c = 1
        elif x1 < 0 and x2 > 0:
            c = 1
        else:
            c = 0
        input.append([x1, x2])
        target.append([1, 0] if c == 0 else [0, 1])
    return input, target

def sample_circle(size):
    input = []
    target = []
    for _ in range(size):
        x1 = 5*(random.random()*2-1)
        x2 = 5*(random.random()*2-1)
        c = 0 if x1*x1 + x2*x2 > 5 else 1
        input.append([x1, x2])
        target.append([1, 0] if c == 0 else [0, 1])
    return input, target

def sample_spiral(size):
    import math
    input = []
    target = []
    for _ in range(int(size/2)):
        r = random.random()
        t = 1.75 * r * 2 * math.pi
        x1 = 5 * r * math.sin(t)
        x2 = 5 * r * math.cos(t)
        input.append([x1, x2])
        target.append([1, 0])
    for _ in range(int(size/2)):
        r = random.random()
        t = 1.75 * r * 2 * math.pi + math.pi
        x1 = 5 * r * math.sin(t)
        x2 = 5 * r * math.cos(t)
        input.append([x1, x2])
        target.append([0, 1])
    return input, target

class NeuralNetworkGenerator(object):
    def generate(
        self, filename,
        data_input_target,
        features=['x1', 'x2'], hidden_layers=[1],
        activate='tanh', learning_rate=0.01,
        batch_size=1, iter=10000
    ):
        with open(filename, 'w+') as f:
            f.write(TF_CODE.format(
                json.dumps(data_input_target),
                json.dumps(features),
                json.dumps([4, 2]),
                activate,
                learning_rate,
                batch_size,
                iter
            ))

"""
example:

gen = NeuralNetworkGenerator()
data_input, data_target = sample_spiral(500)
gen.generate(
    'test.py',
    'input.json',
    'target.json',
    ['x1', 'x2', 'sinx1', 'sinx2'],
    [4, 2],
    'tanh',
    0.03,
    200,
    20000
)
"""

if __name__ == '__main__':
    gen = NeuralNetworkGenerator()
    data_input, data_target = sample_xor(500)
    with open('test_train.json', 'w+') as f:
        f.write(json.dumps({
            'input': data_input,
            'target': data_target
        }))
    gen.generate(
        'test.py',
        'test_train.json',
        ['x1', 'x2'],
        [4, 2],
        'tanh',
        0.03,
        200,
        20000
    )
