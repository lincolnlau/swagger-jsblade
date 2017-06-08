var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var mockGen = require('swagger-mock-file-generator');
var express = require('express');
var middleware = require('swagger-express-middleware-with-chance');
var apiCasesMiddleware = require('api-cases-middleware');
var juicerAdapter = require('juicer-express-adapter');
var chokidar = require('chokidar');
var getConfig = require('../api-creators/getConfigData.js');

module.exports = {
  create: create
};

var mock = {
  server: null,
  swaggerFilePath: '',
  configFilePath: 'mock.config.js',
  options: '',
  cb: null
};

function create (swaggerFile, options, cb) {
  mock.swaggerFilePath = swaggerFile;
  mock.options = options;
  mock.cb = cb;
  var mockFilePath = options.file;
  var port = options.server;
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
              // console.log('含有mock数据的swagger文件生成成功:'+ mockFilePath.green)
              // console.log('使用含有mock数据的swagger文件启动Mock Server'.green);
              runMockServer(mockFilePath, port);
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
    if (path) {
      chokidar.watch(path).on('change', (event, path) => {
        mock.server.close();
        console.log('重新生成mock数据并重启Mock Server......'.green);
        create(mock.swaggerFilePath, mock.options, mock.cb);
      });
    }
  })
}

function createDefaultConfigFile (outPath) {
  var config = getConfig({file: mock.swaggerFilePath});
  if (config && config.swagger && config.swagger.paths) {
    juicerAdapter(path.join(__dirname, '../../templates/mock/config-template.juicer'), config, function (err, str) {
      var filePath = path.join(outPath, 'mock.config.js');
      mock.configFilePath = filePath;
      fs.outputFile(filePath, str, function (err) {
          if (err) {
              throw err;
          }
          console.log(('生成默认配置文件成功!文件位置: ' + filePath).green);
      })
    })
  } else {
    console.log('读取swagger文件配置出错'.red);
  }
}
