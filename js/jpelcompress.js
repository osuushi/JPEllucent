/*
Compresses a transparent PNG into a JSON file that JPEllucent can render on the client side.

This can be run as a standalone command, or as a module.
*/


(function() {
  var extractAlpha, extractColor, fs, runStandalone, spawn,
    _this = this;

  fs = require('fs');

  runStandalone = function() {
    var a, argv, c, inputPath, opt, outputPath, stdout;
    opt = require('optimist');
    opt = opt.usage("Cmpress a transparent PNG to a file to be rendered by JPEllucent\n\nUsage:\n    $0 inputPath [-o outputPath] [-c colorQuality] [-a alphaQuality]\n        OR\n    $0 inputPath --stdout [-c colorQuality] [-a alphaQuality]");
    argv = opt.demand(1).describe("stdout", "Write JSON to standard output instead of file").describe("o", "Output file path; by default inputPath with .json extension is used")["default"]('c', 85).describe('c', "color quality between 0 and 100")["default"]('a', 60).describe('a', "alpha quality between 0 and 100").argv;
    c = argv.c, a = argv.a, stdout = argv.stdout;
    outputPath = argv.o;
    inputPath = argv._[0];
    return _this.compress(inputPath, c, a, function(result) {
      result = JSON.stringify(result);
      if (stdout) {
        return process.stdout.write(result);
      } else {
        if (outputPath == null) {
          outputPath = "" + (inputPath.substring(0, inputPath.lastIndexOf('.'))) + ".json";
        }
        return fs.writeFile(outputPath, result);
      }
    });
  };

  spawn = require('child_process').spawn;

  extractAlpha = function(data, quality, cb) {
    child;
    var bufs, child;
    child = spawn("convert", ("- -alpha extract -quality " + (Math.round(quality)) + " -strip jpg:-").split(' '));
    bufs = [];
    child.stdout.on('data', function(buf) {
      return bufs.push(buf);
    });
    child.stdout.on('end', function() {
      return cb(Buffer.concat(bufs));
    });
    child.stdin.write(data);
    child.stdin.end();
    return null;
  };

  extractColor = function(data, quality, cb) {
    var bufs, child;
    child = spawn("convert", ("- ( -clone 0 -alpha extract )        ( -clone 0 -background black -flatten -alpha off )        -delete 0 -compose Divide -composite        -quality " + (Math.round(quality)) + " -strip jpg:-").split(/\s+/));
    bufs = [];
    child.stdout.on('data', function(buf) {
      return bufs.push(buf);
    });
    child.stdout.on('end', function() {
      return cb(Buffer.concat(bufs));
    });
    child.stdin.write(data);
    child.stdin.end();
    return null;
  };

  /*
  Convert an input file. Object containing data URIs will be passed to cb
  */


  this.compress = function(inputPath, colorQuality, alphaQuality, cb) {
    return fs.readFile(inputPath, function(err, inputData) {
      var alpha, buffers, color, finishedStream, waitCount;
      if (err) {
        throw err;
      }
      waitCount = 2;
      buffers = {};
      color = extractColor(inputData, colorQuality, function(data) {
        waitCount--;
        buffers.color = data;
        return finishedStream();
      });
      alpha = extractAlpha(inputData, alphaQuality, function(data) {
        waitCount--;
        buffers.alpha = data;
        return finishedStream();
      });
      return finishedStream = function() {
        var buf, buf64, key, result;
        if (waitCount) {
          return;
        }
        result = {};
        for (key in buffers) {
          buf = buffers[key];
          buf64 = new Buffer(buf, 'binary').toString('base64');
          result[key] = "data:image/jpeg;base64," + buf64;
        }
        return cb(result);
      };
    });
  };

  if (!module.parent) {
    runStandalone();
  }

}).call(this);
