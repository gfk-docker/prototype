'use strict';

function dom(id) {
   return document.getElementById(id);
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

function filter_string(text) {
   text = text.split('>').join('&gt;');
   text = text.split('<').join('&lt;');
   text = text.split('&').join('&amp;');
   return text;
}

function build_pre_html(text, numbers) {
   var r = [], last = 0;
   numbers.forEach(function (obj) {
      var prefix = filter_string(text.substring(last, obj.startIndex));
      var number = filter_string(text.substring(obj.startIndex, obj.endIndex));
      r.push(prefix);
      r.push('<a class="btn btn-xs btn-primary" range="' + obj.startIndex + ',' + obj.endIndex +'">' + number + '</a>');
      last = obj.endIndex;
   });
   r.push(filter_string(text.substring(last)));
   return r.join('');
}

function build_range_select(a) {
   var container = dom('range');
   var range = a.getAttribute('range').split(',');
   var value = a.textContent;
   container.innerHTML +=
      '<div><label>(position=' + range[0] + ',' + range[1] + ', original=' + value + ') =&gt;</label>' +
      '<input class="form-control" value="' + value +'"/></div>';
}

function init() {
   dom('text').addEventListener('click', function (evt) {
      if (evt.target.tagName.toLowerCase() !== 'a') return;
      build_range_select(evt.target);
   });
}

ajax({
   // need run `python tfcompile.py` to generate `test.py` first.
   url: '/test.py',
   method: 'GET',
   decoder: function (x) {return x;}
}, function (text) {
   ajax({
      url: '/extract',
      method: 'POST',
   }, function (numbers) {
      var html = build_pre_html(text, numbers);
      dom('text').innerHTML = html;
      init();
   });
});
