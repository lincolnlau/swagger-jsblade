var path = require('path');
var fs = require('fs-extra');
var config = require('../../config');
var cli = require('../util/cli');
var util = require('util');
var emit = require('../util/feedback').emit;
var debug = require('debug')('blade');


var FRAMEWORKS = {
  angular1: { source: 'angular1' },
  //angular2: { source: 'angular2' },
  vue: {source: 'vue1'}
}

module.exports = {

  frameworks: FRAMEWORKS,
  create: create
}

//.option('-f, --framework <framework>', 'one of: connect | express')
function create(name, options, cb) {

  function validateName(name) {
    var targetDir = path.resolve(process.cwd(), name);
    if (fs.existsSync(targetDir)) {
      return '目录 ' + targetDir + ' 已经存在.';
    }
    return true;
  }

  if (name) {
    var valid = validateName(name);
    if (typeof valid === 'string') { return cb(new Error(valid)); }
  }

  if (options.framework && !FRAMEWORKS[options.framework]) {
    return cb(new Error(util.format('无法支持的 Framework: %j. 目前支持的 Frameworks: %s', options.framework, Object.keys(FRAMEWORKS).join(', '))));
  }

  var questions = [
    { name: 'name', message: '项目名称?', validate: validateName },
    { name: 'framework', message: 'Framework?', type: 'list', choices: Object.keys(FRAMEWORKS) }
  ];

  var results = {
    name: name,
    framework: options.framework
  };

  cli.requireAnswers(questions, results, function(results) {
    var name = results.name;
    var framework = results.framework;
    var targetDir = path.resolve(process.cwd(), name);
    cloneSkeleton(name, framework, targetDir, function(err) {
      if (err) { return cb(err); }
      emit('Project %s created in %s', name, targetDir);

      var message = util.format('成功了! 你可以启动你的项目通过: "npm run dev %s"', name);

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
    if (err) { return cb(err); }
    customizeClonedFiles(name, framework, destDir, cb);
  };

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

function customizeClonedFiles(name, framework, destDir, cb) {

  // npm renames .gitignore to .npmignore, change it back
  var npmignore = path.resolve(destDir, '.npmignore');
  var gitignore = path.resolve(destDir, '.gitignore');
  fs.rename(npmignore, gitignore, function(err) {
    if (err && !fs.existsSync(gitignore)) { return cb(err); }

    // rewrite package.json
    var fileName = path.resolve(destDir, 'package.json');
    fs.readFile(fileName, { encoding: 'utf8' }, function(err, string) {
      if (err) { return cb(err); }

      var project = JSON.parse(string);
      project.name = name;

      debug('writing project: %j', project);
      fs.writeFile(fileName, JSON.stringify(project, null, '  '), cb);
    });
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
  spawn('npm', ['install'], directory, function(err) {
    if (err) {
      emit('"npm install" 失败. 请在 s％ 下运行 "npm install".', directory);
      return cb(err);
    }
    cb(null, message);
  });
}