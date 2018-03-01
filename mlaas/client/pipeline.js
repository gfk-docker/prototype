'use strict';

function dom(id) {
   return document.getElementById(id);
}

function indexOf(array, key, val) {
   key = key.split('.');
   for(var i = 0; i < array.length; i++) {
      var cur = array[i];
      key.forEach(function(k) {
         cur = cur[k];
      });
      if (cur === val) return i;
   }
   return -1;
}

function pointLineDistance(px, py, line) {
   var lx1 = parseFloat(line.obj.node.getAttributeNS(null, 'x1')),
      ly1 = parseFloat(line.obj.node.getAttributeNS(null, 'y1')),
      lx2 = parseFloat(line.obj.node.getAttributeNS(null, 'x2')),
      ly2 = parseFloat(line.obj.node.getAttributeNS(null, 'y2'));

   if (lx1 > lx2) {
      var tmp = lx1; lx1 = lx2; lx2 = tmp;
   }
   if (px < lx1 || px > lx2) return Infinity;
   return Math.abs(py - ly1);
}

function nearLine(px, py, lines, distance) {
   for(var i = 0; i < lines.length; i++) {
      if (pointLineDistance(px, py, lines[i]) < distance) return i;
   }
   return -1;
}

function adjust(startx, endx) {
   var d = endx-startx, n = lines.length, step = d/n;
   for(var i = 1; i < nodes.length; i++) {
      var newx = startx+i*step;
      nodes[i].obj.animate(100).move(newx-10, 40);
      lines[i-1].obj.node.setAttributeNS(null, 'x1', newx-step);
      lines[i-1].obj.node.setAttributeNS(null, 'x2', newx);
   }
   if (parr.index >= 0) {
      parr.obj.animate(100).move(startx+parr.index*step-5, 30);
   }
}

function del_node(node, i) {
   if (node.type === 'input' || node.type === 'output') {
      return;
   }
   var node = nodes.splice(i, 1)[0],
      line = lines.splice(i-1, 1)[0];
   node.obj.remove();
   line.obj.remove();
   adjust(50, 800);
   select_node(null, -1, true);
   if (lines.length === 1) {
      lines[0].obj.attr({ 'stroke-dasharray': '6,3' });
   }
}

function add_node(line, i) {
   var lx1 = parseFloat(line.obj.node.getAttributeNS(null, 'x1')),
      lx2 = parseFloat(line.obj.node.getAttributeNS(null, 'x2')),
      newlx2 = lx1+(lx2-lx1)/2;
   line.obj.node.setAttributeNS(null, 'x2', newlx2);
   line.obj.attr({ 'stroke-dasharray': null });
   lines.push({
      obj: pen.line(newlx2, 50, lx2, 50).stroke({
         width: 3
      }).attr({
         stroke: '#999',
      }).back()
   });
   var new_node = {
      type: 'calc',
      obj: pen.circle().cx(newlx2).cy(50).radius(10).attr({
         stroke: '#999',
         'stroke-width': 2,
         fill: '#39f'
      })
   };
   nodes.splice(i+1, 0, new_node);
   adjust(50, 800);
   select_node(new_node, i+1, true);
}

function select_node(node, i, force) {
   if (i < 0) {
      parr.index = -1;
      parr.obj.node.style.display = 'none';
   } else if (parr.index === i && !force) {
      parr.index = -1;
      parr.obj.node.style.display = 'none';
   } else {
      parr.index = i;
      parr.obj.node.style.display = null;
      adjust(50, 800);
   }
   update_panels();
}

function show_panel(type) {
   switch (type) {
   case 'calc':
      panels[1].style.display = null;
      break;
   case 'input':
      panels[0].style.display = null;
      break;
   case 'output':
      panels[2].style.display = null;
      break;
   }
}

function hide_panels() {
   panels.forEach(function (p) {
      p.style.display = 'none';
   });
}

function update_panels() {
   hide_panels();
   if (parr.index >= 0) {
      show_panel(nodes[parr.index].type);
   }
}

var panels = [
   dom('panel_input'),
   dom('panel_calc'),
   dom('panel_output')   
];
hide_panels();

var pen = SVG('paper').size('100%', 120);

var lines = [{
   obj: pen.line(50, 50, 800, 50).stroke({
      width: 3
   }).attr({
      stroke: '#999',
      'stroke-dasharray': '6,3'
   })
}];

pen.text('input').move(50, 65).attr({
   'alignment-baseline': 'middle',
   'text-anchor': 'middle'
});
pen.text('output').move(800, 65).attr({
   'alignment-baseline': 'middle',
   'text-anchor': 'middle'
});
var nodes = [{
   type: 'input',
   obj: pen.circle().cx(50).cy(50).radius(10).attr({
      stroke: '#999',
      'stroke-width': 2,
      fill: '#3bf'
   })
}, {
   type: 'output',
   obj: pen.circle().cx(800).cy(50).radius(10).attr({
      stroke: '#999',
      'stroke-width': 2,
      fill: '#3bf'
   })
}];

var parr = {
   index: -1,
   obj: pen.polygon("45,30 55,30 50,35").fill('black')
}
parr.obj.node.style.display = 'none';

// pipeline panel controller
function dispatcher(type, evt) {
   var i = -1, selected = {}, action = false;
   switch(evt.target.tagName.toLowerCase()) {
   case 'circle':
      i = indexOf(nodes, 'obj.node', evt.target);
      if (i >= 0) {
         selected.obj = nodes[i];
         selected.type = 'node';
         selected.index = i;
         action = true;
         console.log(selected.obj);
      }
      break;
   case 'line':
      i = indexOf(lines, 'obj.node', evt.target);
      if (i >= 0) {
         selected.obj = lines[i];
         selected.type = 'line';
         selected.index = i;
         action = true;
         console.log(selected.obj);
      }
      break;
   default:
      i = nearLine(evt.offsetX, evt.offsetY, lines, 8);
      if (i >= 0) {
         selected.obj = lines[i];
         selected.type = 'line';
         selected.index = i;
         action = true;
         console.log('near', selected.obj);
      }
   }

   if (action) {
      console.log(type);
      switch (type) {
      case 'click':
         dispatcher_click(selected);
         break;
      case 'dblclick':
         dispatcher_dblclick(selected);
         break;
      }
   }
}

function dispatcher_click(selected) {
   switch (selected.type) {
   case 'line':
      add_node(selected.obj, selected.index);
      load_hidden_layer_node(nodes[parr.index], parr.index);
      break;
   case 'node':
      load_hidden_layer_node(selected.obj, selected.index);
      select_node(selected.obj, selected.index);
      break;
   }
}

function dispatcher_dblclick(selected) {
   switch (selected.type) {
   case 'line':
      break;
   case 'node':
      del_node(selected.obj, selected.index);
      break;
   }
}

pen.node.addEventListener('click', function (evt) {
   dispatcher('click', evt);
});
pen.node.addEventListener('dblclick', function (evt) {
   dispatcher('dblclick', evt);
});

// hidden layer panel controller
var calc_panels = [
   dom('panel_model_linear')
];

function hide_calc_panels() {
   calc_panels.forEach(function (p) {
      p.style.display = 'none';
   });
}

function show_calc_panel(type) {
   switch(type) {
   case 'linear':
      calc_panels[0].style.display = null;
      break;
   }
}

function update_hidden_layer_node(node, index) {
   var model = dom('sel_calc_model').value;
   switch(model) {
   case 'linear':
      node.model = {
         type: 'linear',
         activation: dom('sel_calc_linear_activation').value,
         neurons: parseInt(dom('txt_calc_linear_neurons').value),
         lrate: parseFloat(dom('txt_calc_linear_lrate').value)
      };
      break;
   }
}

function load_hidden_layer_node(node, index) {
   if (node.type !== 'calc') return;
   var model = node.model || {};
   hide_calc_panels();
   switch(model.type) {
   case 'linear':
   default:
      dom('sel_calc_linear_activation').value = model.activation || 'tanh',
      dom('txt_calc_linear_neurons').value = model.neurons || '',
      dom('txt_calc_linear_lrate').value = model.lrate || '';
   }
   show_calc_panel(model.type || 'linear');
}

dom('sel_calc_model').addEventListener('change', function (evt) {
   hide_calc_panels();
   show_calc_panel(evt.target.value);
});
dom('btn_calc_remove').addEventListener('click', function () {
   if (parr.index < 0) return;
   del_node(nodes[parr.index], parr.index);
});
dom('btn_calc_update').addEventListener('click', function () {
   if (parr.index < 1 || parr.index >= nodes.length) return;
   update_hidden_layer_node(nodes[parr.index], parr.index);
});
dom('panel_data').addEventListener('click', function (evt) {
   if (!evt.target.classList.contains('sel_calc_data')) return;
   document.querySelectorAll('.sel_calc_data').forEach(function (s) {
      s.style.backgroundColor = null;
   });
   evt.target.style.backgroundColor = '#3af';
});

function uriencode(data) {
   if (!data) return data;
   return '?' + Object.keys(data).map(function (x) {
      return (encodeURIComponent(x) + '=' + encodeURIComponent(data[x]))}).join('&');
}

function ajax (options, done_fn, fail_fn) {
  var xhr = new XMLHttpRequest(),
      payload = null;
  xhr.open(options.method || 'POST', options.url + (options.data?uriencode(options.data):''), true);
  xhr.addEventListener('readystatechange', function (evt) {
     if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
        if (~~(evt.target.status/100) === 2) {
           var decode_fn = (options.decoder === undefined)?JSON.parse:options.decoder,
               data = evt.target.response;
            data = decode_fn?decode_fn(data || options.default || 'null'):data;
            done_fn && done_fn(data);
        } else {
           fail_fn && fail_fn(evt.target.status);
        }
     }
  });
  if (options.json) {
     xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
     payload = JSON.stringify(options.json);
  }
  xhr.send(payload);
}

dom('btn_calc_run').addEventListener('click', function () {
   ajax({
      url: '/api',
      method: 'POST',
      json: {
         input: 'test_xor.json',
         hidden: nodes.slice(1, nodes.length-1).map(function (x) {
            return x.model;
         })
      }
   }, function (text) {
      dom('result_calc').innerHTML = '';
      dom('result_calc').innerHTML = text.join('<br />');
   })
});