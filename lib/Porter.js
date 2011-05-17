
;(function(window, undefined) {

  window.Porter = function Porter(resources) {

    if(!(this instanceof Porter)) return new Porter(resources);    

    var self = this;
    var cache = this.cache = {};
    var dloc = document.location;

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
      }
    };

    this.headers = this.options.headers;

    this._listeners = {
      'loading': function() {},
      'loaded': function() {},
      'interactive': function() {},
      'default': function() {}
    };

    this.on = function(listeners) {
      for (var listener in listeners) {
        if (listeners.hasOwnProperty(listener)) {
          self._listeners[listener] = listeners[listener];
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

      ajax.run = function(callbacks) {
        
        // merge the global _listeners into this xhr.
        for(l in self._listeners) {
          if(self._listeners.hasOwnProperty(l)) {
            ajax._listeners[l] = self._listeners[l];
          }
        }

        // is callbacks actually plural? if so, merge.
        if(!(typeof callbacks === 'function')) {
          for(c in callbacks) {
            if(callbacks.hasOwnProperty(c)) {
              ajax._listeners[c] = callbacks[c];
            }
          }
        }
        else {
          ajax._listeners['default'] = callbacks;
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
          try { ajax.xhr.send(JSON.stringify(conf.data)); }
          catch(ex) { ajax._listeners['default'](ex, null, null, null); }
        }
        else {
          ajax.xhr.send();
        }

        ajax.xhr.onreadystatechange = function() {

          switch (ajax.xhr.readyState) {
            case 1:
              ajax._listeners.loading();
            break;
            case 2:
              ajax._listeners.loaded();
            break;
            case 3:
              ajax._listeners.interactive();
            break;
            case 4:

              var response = ajax.xhr.responseText.trim(),
                  status = ajax.xhr.status,
                  statusText = ajax.xhr.statusText;

              try {
                response = isJSON(response) ? JSON.parse(response) : response;
              }
              catch(ex) {
                ajax._listeners['default'](ex, null, null, null);
              }

              if(ajax._listeners[status]) {
                ajax._listeners[status](null, response, statusText, self.xhr);
              }
              else if(ajax._listeners['default']) {
                ajax._listeners['default'](null, response, statusText, self.xhr);
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
        delete self.cache[d];
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

    function req(url, method, replace, data, callbacks) {

      if(window) {
        return new self.ajax({

          // merege in the options and build the url to request.
          url: [self.options.protocol, '://', self.options.ip || self.options.host, ':', self.options.port, url].join(''),
          type: method,
          data: data || {}

        }).run(callbacks);
      }
      else {
        
        // nodejs
        
      }
    }

    function buildResources(resources, ns) {
      for (var resource in resources) {
        if (resources.hasOwnProperty(resource)) {
          
          if(Object.prototype.toString.call(resources[resource]) == "[object Array]") {

            ns[resource] = (function(request) {

              return function() {

                var keys = [],
                    tmp = [],
                    method = tmp[0] = request[0],
                    url = tmp[1] = request[1];
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

                args = [url, method].concat(args);
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
