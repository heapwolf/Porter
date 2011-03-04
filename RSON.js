
;(function() { 
  var RSON = (typeof exports !== "undefined" ? exports : window).RSON = function(resources) {

    var self = this;
    var cache = this.cache = {};

    this.options = {
      protocol: 'http',
      ip: '127.0.0.1',
      port: 80,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      lib: null
    };

    this.headers = this.options.headers;

    this.use = function(options) {
      for (var option in options) {
        if (options.hasOwnProperty(option)) {
          self.options[option] = options[option];
        }
      }
      return self;
    };

    this.ajax = function(conf) {

      var self = this;

      this.listeners = {
        beforeSend: conf.beforeSend || function() {},
       	loading: conf.loading || function() {},
       	loaded: conf.loaded || function() {},
       	interactive: conf.interactive || function() {},
       	success: conf.success || function() {},
       	error: conf.error || function() {}
      };

      this.on = function(event, cb) {
         self.listeners[event] = cb;
      };

      this.xhr = (function() {
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
              throw new Error('Don\'t bother useing the internet.');
            }
          }       
        }
      })();

      this.run = function() {
        self.xhr.open(conf.type, conf.url, true);
        self.listeners.beforeSend(self.xhr);
        self.xhr.send(conf.url);

        self.xhr.onreadystatechange = function() {

          switch (self.xhr.readyState){
            case 1:
              self.listeners.loading();
            break;
            case 2:
              self.listeners.loaded();
            break;
            case 3:
              self.listeners.interactive();
            break;
            case 4:
              var response = self.xhr.responseText,
                status = self.xhr.status,
                statusText = self.xhr.statusText;
            
            	try {
            	  response = JSON.parse(response);
            	  cache[conf.url] = response;
                self.listeners.success(response, statusText, self.xhr);
            	}
            	catch(ex) {
                self.listeners.error(self.xhr, statusText, ex.message);
              }
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

    function req(url, method, replace, data, callback) {

      var ajax;

      if(typeof callback === 'undefined') {
        callback = stagingCall;
      }

      url = [self.options.protocol, '://', self.options.ip, ':', self.options.port, request.path, '?callback=?'].join('');

      var xhrConf = {
    
        url: url,
        type: method,
        data: data || null,
        beforeSend: function(xhr) {

          var headers = self.options.headers;

          for(var header in headers) {
            if (headers.hasOwnProperty(header)) {
              xhr.setRequestHeader(header, headers[header]); 
            }
          }
        },

        success: function(data, textStatus, XMLHttpRequest) {
          self.cache[url] = data;
          callback(null, data, textStatus, XMLHttpRequest);
        },

        error: function(XMLHttpRequest, textStatus, errorThrown){
          callback([XMLHttpRequest, textStatus, errorThrown], null);
        }

      }

      if(window) {
        ajax = self.options.lib ? self.options.lib(xhrConf) : new self.ajax(xhrConf).run();
      }
      else {
        // nodejs
      }
    }

    for (var resource in resources) {
      if (resources.hasOwnProperty(resource)) {
        if(!self[resource]) {
          self[resource] = {};
        }
        for (var request in resources[resource]) {
          if (resources[resource].hasOwnProperty(request)) {
            
            self[resource][request] = (function(request) {

              var keys = [],
                  method = request.shift(),              
                  url = request.shift(),
                  matcher = normalizePath(url, keys);

              return function() {
                
                var args = Array.prototype.slice.call(arguments),
                    alen = args.length,
                    klen = keys.length,
                    key;                                    

                if(alen === 1 && args[0] === true) {
                  return args[alen](self.cache[url]);
                }
                else if(alen === 1 && klen > 0) {
                  throw new Error('Not enough arguments provided.')
                }

                if (klen > 0) {

                  // If we have keys, then we need at least two arguments
                  // and first argument in a two-argument pair can be assumed
                  // to be the replacement map.
                  
                  if (alen < 2) {
                    throw new Error('Cannot execute request ' + request + ' without replacement map');
                  }
                  else if (alen === 2) {
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
                      url = url.replace(':' + key, args[0][key]);

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
            })(resources[resource][request]);

          }
        }
      }
    }
    return self;
  }

})();