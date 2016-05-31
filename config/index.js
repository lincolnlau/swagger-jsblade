var path = require('path');
var _ = require('lodash');
var debug = require('debug')('jsblade');

var config = {
  rootDir: path.resolve(__dirname, '..'),
  userHome: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
  debug: !!process.env.DEBUG
};

config.nodeModules = path.resolve(config.rootDir, 'node_modules');

config.project = {
  port: process.env.PORT || 10010,
  templateDir: path.resolve(__dirname, '..', 'templates')
};


module.exports = config