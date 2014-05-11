// Generated by CoffeeScript 1.7.1
var CacheliciousFs, ONE_HOUR, ONE_MONTH, ONE_WEEK, ONE_YEAR, STATIC_DIR, app, cachelicious, error404, errorHandler, fs, http, onFinished, path, resolve, server, staticHandler, url, zlib;

url = require('url');

path = require('path');

http = require('http');

zlib = require('zlib');

resolve = require('resolve-path');

onFinished = require('finished');

STATIC_DIR = process.env['STATIC_DIR'] || '.';

if (process.env['USE_CACHELICIOUS']) {
  cachelicious = require('cachelicious');
  CacheliciousFs = cachelicious.fs;
  fs = new CacheliciousFs(process.env['CACHE_SIZE'] || 50 * 1024 * 1024);
} else {
  fs = require('fs');
}

ONE_HOUR = 60 * 60;

ONE_WEEK = ONE_HOUR * 24 * 7;

ONE_MONTH = ONE_WEEK * 4;

ONE_YEAR = ONE_MONTH * 12;

staticHandler = function(pathname, req, res, callback) {
  var absolutePath, err, stream;
  try {
    pathname = parse(req.url).pathname;
    absolutePath = resolve(req.path.slice(1));
    stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
    onFinished(res, function(err) {
      stream.destroy();
      if (err) {
        callback(err);
      }
    });
  } catch (_error) {
    err = _error;
    callback(err);
  }
};

errorHandler = function(err, pathname, req, res) {
  console.error(err.stack);
  res.status(err.status || 500);
  if (req.xhr) {
    res.send({
      error: err.status === 404 ? '404 Not Found' : 'Something blew up!'
    });
  } else {
    pathname = "/error/" + (err.status || 500) + ".html";
    staticHandler(pathname, req, res, function(err) {
      res.send('Something blew up!');
    });
  }
};

error404 = function(pathname, req, res) {
  var err;
  err = new Error('File Not Found');
  err.status = 404;
  errorHandler(err);
};

app = http.createServer(function(req, res) {
  var host, pathname, query, _ref;
  _ref = parse(req.url).pathname, pathname = _ref.pathname, query = _ref.query;
  if (pathname[1] === '_' || /^\/(.*\/_.*|node_modules\/.*|package.json|server.js|Procfile|vendor\/.*)$/.test(pathname)) {
    return error404(pathname, req, res);
  }
  pathname = pathname(/^(.+)\.(\d+)\.(js|css|png|jpg|gif)$/, '$1.$3');
  host = req.headers.host;
  res.removeHeader('X-Powered-By');
  res.removeHeader('Last-Modified');
  if (/.*\/[^\.\/]*$/.test(pathname)) {
    pathname = path.join(pathname, process.env['INDEX_FILE'] || 'index.html');
  }
  staticHandler(pathname, req, res, function(err) {
    error404(pathname, req, res);
  });
});

server = app.listen(process.env['PORT'], function() {
  var address;
  address = server.address();
  console.log("Listening on port " + address.port + "...");
});
