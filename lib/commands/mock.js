var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var mockGen = require('swagger-mock-file-generator');
var express = require('express');
var middleware = require('swagger-express-middleware-with-chance');
var inquirer = require('inquirer');
var cli = require('../util/cli');
var apiCasesMiddleware = require('api-cases-middleware');
var proxyMiddleware = require('express-proxy-middleware');
var juicerAdapter = require('juicer-express-adapter');
var chokidar = require('chokidar');
var getConfig = require('../api-creators/getConfigData.js');
var Finder = require('fs-finder');

module.exports = {
  create: create
};

var mock = {
  server: null,
  swaggerFilePath: '',
  configFilePath: '',
  options: '',
  cb: null
};

function create (swaggerFile, options, cb) {
  mock.swaggerFilePath = swaggerFile;
  mock.options = options;
  mock.cb = cb;
  var mockFilePath = options.file;
  var port = options.server;
  var createConfigQuestion = { name: 'create', message: '是否需要生成默认配置文件?', type: 'confirm', default: true};

  if(!/(\.json|\.yaml)$/.test(swaggerFile)){
    console.log('需要json或yaml格式的swagger文件'.red);
    throw new Error();
  } else {
    fs.access(swaggerFile, fs.R_OK, function(err){
      if(err){
        console.log(swaggerFile + '该swagger文件不存在或无读权限'.red);
        throw new Error();
      } else {
        if (mockFilePath) {
          mockGen(swaggerFile, mockFilePath, function(err){
            if (err) throw err;
            var resolvedPath = path.resolve(path.join(mockFilePath, '..') + '/mock.config.js');
            if (!options.config && !fs.existsSync(resolvedPath)) {
              inquirer.prompt(createConfigQuestion).then(function(answers) {
                if (answers.create) {
                  mock.configFilePath = resolvedPath;
                  fs.writeFile(mock.configFilePath, '', (err) => {
                    if (err) throw err;
                    var mockCB = runMockServer;
                    createDefaultConfigFile(mockCB);
                  });
                } else {
                  runMockServer(mockFilePath, port);
                }
              });
            } else {
              mock.configFilePath = mockConfig(options);
            }
              // console.log('含有mock数据的swagger文件生成成功:'+ mockFilePath.green)
              // console.log('使用含有mock数据的swagger文件启动Mock Server'.green);
          })
        } else {
          if (port) {
            // console.log('使用'+ swaggerFile +'文件启动Mock Server'.green);
            runMockServer(swaggerFile, port);
          }
        }
      }
    })
  }
}

function mockConfig(options) {
  var configPath = options.config || '';
  var hasLite = options.lite;
  var questiona = { name: 'useDefault', message: '是否需要使用默认配置文件?', type: 'confirm', default: true};
  if (!hasLite && !configPath) {
    Finder.from(path.join(options.file, '..')).findFiles('mock.config.js', function(files) {
      if (files) {
        inquirer.prompt(questiona).then(function(answers) {
          if (answers.useDefault) {
            // 默认路径
            configPath = files[0];
          }
          mock.configFilePath = configPath;
          runMockServer(options.file, options.server);
        });
      } else{
        runMockServer(options.file, options.server);
      }
    });
  } else {
    runMockServer(options.file, options.server);
  }
  mock.configFilePath = configPath;
  return configPath;
}

function runMockServer(swaggerFile, port) {
  var swagger = swaggerFile;
  var port = isNaN(parseInt(port))? 8000 : parseInt(port);
  // Set the DEBUG environment variable to enable debug output
  process.env.DEBUG = 'swagger:middleware';
  var app = express();
  middleware(swagger, app, function (err, middleware) {
    app.use(
        middleware.metadata(),
        middleware.CORS(),
        middleware.files(),
        middleware.parseRequest(),
        // middleware.validateRequest(),
        proxyMiddleware(mock.configFilePath),
        apiCasesMiddleware(mock.configFilePath),
        middleware.mock()
    );

    mock.server = app.listen(port, function () {
      openHotReload();
      console.log('The mock server is now running at http://localhost:' + port);
    });
  });
}

function openHotReload () {
  var paths = [mock.swaggerFilePath, mock.configFilePath];
  paths.forEach((path) => {
    if (path && fs.existsSync(path)) {
      chokidar.watch(path).on('change', (event, path) => {
        mock.server.close();
        console.log('重新生成mock数据并重启Mock Server......'.green);
        create(mock.swaggerFilePath, mock.options, mock.cb);
      });
    }
  })
}

function createDefaultConfigFile (cb) {
  if (!mock.configFilePath) {
    console.log('读取默认配置文件路径出错'.red);
    cb(mock.options.file, mock.options.server);
  } else {
    var config = getConfig({file: mock.swaggerFilePath});
    if (config && config.swagger && config.swagger.paths) {
      juicerAdapter(path.join(__dirname, '../../templates/mock/config-template.juicer'), config, function (err, str) {
        outPutFile(mock.configFilePath, str, cb);
      })
    } else {
      cb(mock.options.file, mock.options.server);
      console.log('读取swagger文件配置出错'.red);
    }
  }
}

function outPutFile (filePath, str, cb) {
  fs.outputFile(filePath, str, function (err) {
      if (err) {
          throw err;
      }
      cb(mock.options.file, mock.options.server);
      console.log(('生成默认配置文件成功!文件位置: ' + filePath).green);
  })
}
