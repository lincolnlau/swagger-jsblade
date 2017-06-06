var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var mockGen = require('swagger-mock-file-generator');
var express = require('express');
var middleware = require('swagger-express-middleware-with-chance');
var inquirer = require('inquirer');
var cli = require('../util/cli');
module.exports = {
  create: create
};

function create (swaggerFile, options, cb) {
  //console.log(options.file);
  var mockFilePath = options.file;
  var mockConfigPath = '';
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
        mockConfigPath = mockConfig(options);
        if (mockFilePath) {
          mockGen(swaggerFile, mockFilePath, function(err){
            if (err) throw err;
            if (!options.config && !fs.existsSync('./mock/mock.config.js')) {
              //todo 生成path调用文件创建
              mockConfigPath = './mock/mock.config.js';
              fs.writeFile(mockConfigPath, '', (err) => {
                  if (err) throw err;
                  console.log(mockConfigPath + " 文件生成成功!");
              });
            }
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

function mockConfig(options) {
  var configPath = options.config || '';
  var hasLite = options.lite;
  var questiona = { name: 'useDefault', message: '是否需要使用默认配置文件?', type: 'confirm', default: true};
  if (!hasLite && !configPath) {
    fs.exists('mock.config.js', function(exists) {
      if (!exists) {
        inquirer.prompt(questiona).then(function(answers) {
          if (answers.useDefault) {
            // 默认路径
            configPath = './test/mock.config.js';
          }
        });
      }
    });
  }
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
        middleware.mock()
    );

    app.listen(port, function () {
      console.log('The mock server is now running at http://localhost:' + port);
    });
  });
}
