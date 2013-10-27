(function() {
  var addObserver, changeObserver, getJSON, imgcache, loadImageNode, needsFallback,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  imgcache = {};

  this.JPEl = new ((function() {
    function _Class() {
      this.createImage = __bind(this.createImage, this);
    }

    _Class.prototype.loadImageToURI = function(url, cache, cb) {
      if (cache == null) {
        cache = true;
      }
      if (cb == null) {
        cb = cache;
        cache = true;
      }
      if (needsFallback()) {
        cb(this.getFallbackURL(url));
        return;
      }
      if (cache && (imgcache[url] != null)) {
        cb(imgcache[url]);
        return;
      }
      return getJSON(url, function(data) {
        var alpha, canvas, color, count;
        canvas = document.createElement('canvas');
        color = new Image;
        alpha = new Image;
        count = 2;
        alpha.onload = color.onload = function() {
          var cx, h, i, maskData, offsetData, result, w, _i, _ref, _ref1;
          count--;
          if (count) {
            return;
          }
          _ref = [color.width, color.height], w = _ref[0], h = _ref[1];
          canvas.width = w;
          canvas.height = h;
          cx = canvas.getContext('2d');
          cx.globalCompositeOperation = 'copy';
          cx.drawImage(alpha, 0, 0);
          maskData = cx.getImageData(0, 0, w, h);
          data = maskData.data;
          if (data.set != null) {
            offsetData = data.subarray(0, data.length - 1);
            data.set(offsetData, 1);
          } else {
            for (i = _i = 0, _ref1 = 4 * data.length; _i < _ref1; i = _i += 4) {
              data[i + 3] = data[i];
            }
          }
          cx.putImageData(maskData, 0, 0);
          cx.globalCompositeOperation = 'source-in';
          cx.drawImage(color, 0, 0);
          result = canvas.toDataURL();
          if (cache) {
            imgcache[url] = result;
          }
          return cb(result);
        };
        color.src = data.color;
        return alpha.src = data.alpha;
      });
    };

    _Class.prototype.createImage = function(url, cache) {
      var img;
      if (cache == null) {
        cache = true;
      }
      img = new Image;
      this.loadImageToURI(url, cache, function(dataURI) {
        return img.src = dataURI;
      });
      return img;
    };

    _Class.prototype.isObserving = false;

    _Class.prototype.startObservers = function() {
      if (!MutationObserver) {
        return;
      }
      if (this.isObserving) {
        return;
      }
      addObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      changeObserver.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-jpel"]
      });
      return this.isObserving = true;
    };

    _Class.prototype.stopObservers = function() {
      if (!MutationObserver) {
        return;
      }
      if (!this.isObserving) {
        return;
      }
      if (typeof addObserver !== "undefined" && addObserver !== null) {
        addObserver.disconnect();
      }
      if (typeof changeObserver !== "undefined" && changeObserver !== null) {
        changeObserver.disconnect();
      }
      return this.isObserving = false;
    };

    _Class.prototype.getFallbackURL = function(jsonURL) {
      return "" + (jsonURL.substring(0, jsonURL.lastIndexOf('.'))) + ".png";
    };

    _Class.prototype.loadDOMImages = function(node) {
      var img, _i, _len, _ref, _results;
      if (this.isObserving) {
        return;
      }
      if (node == null) {
        node = document.body;
      }
      _ref = node.getElementsByTagName('img');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        img = _ref[_i];
        _results.push(loadImageNode(img));
      }
      return _results;
    };

    _Class.prototype.emptyCache = function() {
      return imgcache = {};
    };

    return _Class;

  })());

  needsFallback = function() {
    var canvas, cx, e, fallback;
    fallback = false;
    try {
      canvas = document.createElement('canvas');
      cx = canvas.getContext('2d');
      new Uint8ClampedArray;
    } catch (_error) {
      e = _error;
      fallback = true;
    }
    needsFallback = function() {
      return fallback;
    };
    return fallback;
  };

  getJSON = function(url, cb) {
    var req;
    req = new XMLHttpRequest;
    req.onload = function() {
      return cb(JSON.parse(this.responseText));
    };
    req.open('get', url, true);
    return req.send();
  };

  loadImageNode = function(node) {
    var url;
    if (url = node.getAttribute('data-jpel')) {
      return JPEl.loadImageToURI(url, function(dataURL) {
        return node.src = dataURL;
      });
    }
  };

  JPEl.loadDOMImages();

  if (typeof MutationObserver !== "undefined" && MutationObserver !== null) {
    addObserver = new MutationObserver(function(records) {
      var n, r, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        r = records[_i];
        _results.push((function() {
          var _j, _len1, _ref, _ref1, _results1;
          _ref1 = (_ref = r.addedNodes) != null ? _ref : [];
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            n = _ref1[_j];
            if (n.nodeName === 'IMG') {
              _results1.push(loadImageNode(n));
            }
          }
          return _results1;
        })());
      }
      return _results;
    });
    changeObserver = new MutationObserver(function(records) {
      var r, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        r = records[_i];
        _results.push(loadImageNode(r.target));
      }
      return _results;
    });
    JPEl.startObservers();
  }

}).call(this);
