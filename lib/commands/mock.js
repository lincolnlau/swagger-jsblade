var path = require('path');
var fs = require('fs-extra');
var config = require('../../config');
var cli = require('../util/cli');
var util = require('util');
var emit = require('../util/feedback').emit;
var debug = require('debug')('blade');


var FRAMEWORKS = {
  mockServer: { source: 'mock' }
}

module.exports = {
  frameworks: FRAMEWORKS,
  create: create
}

function create(name, options, cb) {

  console.log("create mock server");

  function validateName(name) {
    var targetDir = path.resolve(process.cwd(), name);
    if (fs.existsSync(targetDir)) {
      return '目录 ' + targetDir + ' 已经存在.';
    }
    return true;
  }

  if (options.framework && !FRAMEWORKS[options.framework]) {
    return cb(new Error(util.format('无法支持的 Framework: %j. 目前支持的 Frameworks: %s', options.framework, Object.keys(FRAMEWORKS).join(', '))));
  }

  var questions = [
    { name: 'name', message: '项目名称?'},
    { name: 'framework', message: 'Framework?', type: 'list', choices: Object.keys(FRAMEWORKS) }
  ];

  var results = {
    name: name,
    framework: options.framework
  };

  cli.requireAnswers(questions, results, function(results) {
    console.log(results);
    var name = results.name;
    var framework = results.framework;
    var targetDir = path.resolve(process.cwd(), name);
    console.log(targetDir);
    cloneSkeleton(name, framework, targetDir, function(err) {
      if (err) { return cb(err); }
      emit('Mock server %s created in %s', name, targetDir);

      var message = util.format('成功了! 你可以在你的项目下面启动你的Mock server通过: "npm run mock"');

      installDependencies(targetDir, message, cb);
      
    });
  });
}

function cloneSkeleton(name, framework, destDir, cb) {
  
  var templateDir = config.project.templateDir;

  framework = FRAMEWORKS[framework];
  var sourceDir = path.resolve(templateDir, framework.source);
  var overlayDir = (framework.overlay) ? path.resolve(templateDir, framework.overlay) : null;

  var done = function(err) {
    if (err) { 
      return cb(err); 
    } else {
      return cb()
    }
  };

  console.log("________________________")
  debug('copying source files from %s', sourceDir);
  console.log("overlayDir    %s", overlayDir);
  console.log("destDir    %s", destDir);
  console.log("sourceDir    %s", sourceDir);
  fs.copy(sourceDir, destDir, true, function(err) {
    if (err) { 
      console.log(err);
      return cb(err); 
    }
    if (overlayDir) {
      debug('copying overlay files from %s', overlayDir);
      fs.copy(overlayDir, destDir, false, done);
    } else {
      done();
    }
  });
}

function spawn(command, options, cwd, cb) {

  var cp = require('child_process');
  var os = require('os');

  var isWin = /^win/.test(os.platform());

  emit('Running "%s %s"...', command, options.join(' '));

  var npm = cp.spawn(isWin ?
                       process.env.comspec :
                       command,
                     isWin ?
                       ['/c'].concat(command, options) :
                       options,
                     { cwd: cwd });
  npm.stdout.on('data', function (data) {
    emit(data);
  });
  npm.stderr.on('data', function(data) {
    emit('%s', data);
  });
  npm.on('close', function(exitCode) {
    if (exitCode !== 0) { var err = new Error('exit code: ' + exitCode); }
    cb(err);
  });
  npm.on('error', function(err) {
    cb(err);
  });
}

function installDependencies(directory, message, cb) {
  spawn('npm', ['install', 'swagger-express-middleware-with-chance', '--save'], directory, function(err) {
    if (err) {
      emit('"npm install" 失败. 请在 s％ 下运行 "npm install swagger-express-middleware-with-chance --save".', directory);
      return cb(err);
    }
    cb(null, message);
  });
}