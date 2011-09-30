
;(function(window, undefined) {

  window.Porter = function Porter(resources) {

    if(!(this instanceof Porter)) return new Porter(resources);

    var self = this;
    var cache = this.cache = {};
    var dloc = document.location;
    var noop = function() {};
    var dnode = (function() {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--){
        if(scripts[i].src === '/dnode') {
          return true;
        }
      }
      return false;
    }());

    function isJSON(str) {
      if (str.length == 0) return false;
      str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
      str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
      str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
      return (/^[\],:{}\s]*$/).test(str);
    }

    this.options = {
      protocol: 'http',
      ip: dloc.hostname,
      host: dloc.hostname,
      port: dloc.port === '' ? 80 : dloc.port,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      delay: false
    };
    this._locks = {};

    this.headers = this.options.headers;
    this._listeners = {};

    function addListener(self, action, listener) {
      var listeners = self._listeners[action];
      listeners ?
          listeners.push(listener)
          :
          (self._listeners[action] = [listener]);
    };

    function executeListener(self, action) {
      var args = Array.prototype.slice.call(arguments, 2),
          listeners = self._listeners[action];

      if (listeners) {
        for (var i = 0, l = listeners.length; i < l; i++) {
          // Returning false will stop propagation
          if (listeners[i].apply(null, args) === false) break;
        }
        return true;
      } else {
        return false;
      }

    };

    this.on = function(listeners) {
      for (var listener in listeners) {
        if (listeners.hasOwnProperty(listener)) {
          addListener(self, listener, listeners[listener]);
        }
      }
      return self;
    };

    this.use = function(options) {
      for (var option in options) {
        if (options.hasOwnProperty(option)) {
          self.options[option] = options[option];
        }
      }
      return self;
    };

    this.ajax = function(conf) {

      var ajax = this;
      ajax._listeners = {};

      ajax.xhr = (function() {
        if(typeof XMLHttpRequest != "undefined") {
          return new XMLHttpRequest();
        }
        else {
          try {
            return new ActiveXObject("Msxml2.XMLHTTP");
          } catch (e) {
            try {
              return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (err) {
              throw new Error('Browser too old.');
            }
          }
        }
      })();

      ajax.run = function(callbacks, validators) {

        // Setup locks
        if (self.options.delay !== false && conf.type !== 'get') {
          if (!conf.ignoreLocks && self._locks[conf.url]) {
            self._locks[conf.url].push({
              conf: conf,
              callbacks: callbacks,
              validators: validators
            });
            return;
          } else {
            self._locks[conf.url] = [];
          }
        }

        // is callbacks actually plural? if so, merge.
        if(!(typeof callbacks === 'function')) {
          for(c in callbacks) {
            if(callbacks.hasOwnProperty(c)) {
              addListener(ajax, c, callbacks[c]);
            }
          }
        }
        else {
          addListener(ajax, 'default', callbacks);
        }

        // merge the global _listeners into this xhr.
        for(l in self._listeners) {
          if(self._listeners.hasOwnProperty(l)) {
            for (var i = 0; i < self._listeners[l].length; i++) {
              addListener(ajax, l, self._listeners[l][i]);
            }
          }
        }

        ajax.xhr.open(conf.type, conf.url, true);

        var headers = self.options.headers;

        // pull from the default headers.
        for(var header in headers) {
          if (headers.hasOwnProperty(header)) {
            ajax.xhr.setRequestHeader(header, headers[header]);
          }
        }

        if(conf.data) {

          try {

            // if there is data, and there is also an outgoing data validator,
            // verify that the value returned is true, otherwise provide the
            // returned value as the 'err' to the listener/callback.

            var validation = true, validator;

            if((validators && validators.outbound) || self.outbound) {
              validator = validators || self;
              validation = validator.outbound(conf.data);
              if(validation !== true) {
                throw new Error(validation);
              }
            }

            ajax.xhr.send(JSON.stringify(conf.data));

          }
          catch(ex) { executeListener(ajax, 'default', ex, null, null, null); }
        }
        else {
          ajax.xhr.send();
        }

        ajax.xhr.onreadystatechange = function() {

          switch (ajax.xhr.readyState) {
            case 1:
              executeListener(ajax, 'loading');
            break;
            case 2:
              executeListener(ajax, 'loaded');
            break;
            case 3:
              executeListener(ajax, 'interactive');
            break;
            case 4:

              // Release locks or run delayed requests
              if (!conf.ignoreLocks && conf.type !== 'get' &&
                  self.options.delay !== false) {

                setTimeout(function() {
                  var data = self._locks[conf.url].shift();

                  // If we have any request queued
                  if (data) {
                    var _locks = self._locks;

                    // Temporally clear locks
                    self._locks = {};

                    // Do unlocked request
                    var req = new self.ajax(data.conf);
                    req.run(data.callbacks, data.validators);

                    // Restore locks
                    self._locks = _locks;
                  } else {
                    // Remove lock
                    self._locks[conf.url] = null;
                  }
                }, self.options.delay);
              }

              var response = ajax.xhr.responseText.trim(),
                  status = ajax.xhr.status,
                  statusText = ajax.xhr.statusText,
                  validator,
                  validation = true;

              try {
                response = isJSON(response) ? JSON.parse(response) : response;
              }
              catch(ex) {
                executeListener(ajax, 'default', ex, null, null, null);
              }

              // if there is validation, and it returns anything other
              // than true, it will be considered an error and that
              // value will be returned as the 'err' of the listener/callback.

              if((validators && validators['inbound']) || self.inbound) {
                validator = validators || self;
                validation = validator['inbound'](response);
              }

              var codeAction = executeListener(ajax, status,
                                               validation ? null : validation,
                                               response, statusText, self.xhr);
              if (!codeAction) {
                executeListener(ajax, 'default', validation ? null : validation,
                                response, statusText, self.xhr);
              }

              cache[conf.url] = response;

            break;
          }
        };
      };
      return this;
    };

    this.clear = function() {
      for(var d in self.cache) {
        if(self.cache.hasOwnProperty(d)) { delete self.cache[d]; }
      }
    }

    function normalizePath(path, keys) {
      // normalizePath by TJ Holowaychuk (https://github.com/visionmedia)
      path = path
        .concat('/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
          keys.push(key);
          slash = slash || '';
          return [
            (optional ? '' : slash),
            '(?:',
            (optional ? slash : ''),
            (format || '') + (capture || '([^/]+?)') + ')',
            (optional || '')].join('');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.+)');
      return new RegExp('^' + path + '$', 'i');
    }

    function req(url, method, replace, data, callbacks, validators, resource) {

      if(method === 'rpc') {

        if(!dnode) {
          var script = document.createElement('script');
          script.src = '/dnode.js';
          document.body.appendChild(script);
        }

        var args = ([].slice.call(arguments)).splice(2, arguments.length);

        DNode.connect(function (remote) {
          remote[resource](args, callbacks);
        });

      }
      else {

        var params = '', pcount = 0;

        if(method === 'get') {
          for(var d in data) {
            if(data.hasOwnProperty(d)) {
              if(pcount===0) { params += '?'; }
              params += encodeURIComponent(d) + "=" + encodeURIComponent(data[d]) + "&";
              pcount++;
            }
          }
        }

        return new self.ajax({

          // merege in the options and build the url to request.
          url: [self.options.protocol, '://', self.options.ip || self.options.host, ':', self.options.port, url, params].join(''),
          type: method,
          data: data || {}

        }).run(callbacks, validators ? validators.inbound : null);
      }

    }

    function buildResources(resources, ns) {
      for (var resource in resources) {
        if (resources.hasOwnProperty(resource)) {

          if(Object.prototype.toString.call(resources[resource]) == "[object Array]") {

            ns[resource] = (function(request) {

              return function() {

                var keys = [],
                    method = request[0],
                    url = request[1],
                    validators = request[2],
                    matcher = normalizePath(url, keys),

                    args = Array.prototype.slice.call(arguments),
                    alen = args.length,
                    klen = keys.length,
                    key = null;

                if(alen === 1 && args[0] === true) {
                  return args[alen](self.cache[url]);
                }

                url = url.replace(/{([^{}]*)}/g, function (a, b) {
                  var r = args[0][b];
                  return typeof r === 'string' || typeof r === 'number' ? escape(r) : a;
                });

                if (klen > 0) {

                  // If we have keys, then we need at least two arguments
                  // and first argument in a two-argument pair can be assumed
                  // to be the replacement map.

                  if (alen === 1) {
                    args.splice(0, -1, null);
                    args.splice(0, -1, null);
                  }

                  if (alen === 2) {
                    args.splice(1, -1, null);
                  }

                  if (typeof args[0] === 'string') {
                    if (klen > 1) {
                      throw new Error('Wrong number of keys in replacement. Expected ' + klen + ' got 1.');
                    }

                    key = keys[0];
                    url = url.replace(':' + key, args[0]);

                  }
                  else {

                    while (klen--) {
                      key = keys[klen];
                      var val = args && args[0] ? args[0][key] : '',
                          replace = (val === '') ? new RegExp('/?:' + key) : ':' + key;
                      url = url.replace(replace, val);

                    }
                  }
                }
                else {
                  // If we don't have keys, then we need at least one argument
                  // and the first argument in a two-argument pair can be assumed
                  // to be the data for the request.

                  if (alen < 1 || alen > 2) {
                    throw new Error('Cannot execute request ' + request + ' with ' + alen + ' arguments.');
                  }
                  else if (alen === 1) {
                    args.splice(0, -1, null);
                  }

                  args.splice(0, -1, null);
                }

                args = [url, method].concat(args, validators, resource);

                req.apply(null, args);
              }
            })(resources[resource]);

          }
          else {
            if(!ns[resource]) {
              ns[resource] = {};
            }
            buildResources(resources[resource], ns[resource]);
          }
        }
      }
    }

    buildResources(resources, self);

    return self;
  }

}(window));
