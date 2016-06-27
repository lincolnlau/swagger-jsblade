var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var mockGen = require('swagger-mock-file-generator');
var express = require('express');
var middleware = require('swagger-express-middleware-with-chance');

module.exports = {
  create: create
}

function create(swaggerFile, options, cb) {

  //console.log(options.file);
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
        if(mockFilePath){
          mockGen(swaggerFile, mockFilePath, function(err){
            if (err) throw err;
            console.log('含有mock数据的swagger文件生成成功:'+ mockFilePath.green)
            if (port) {
              console.log('使用含有mock数据的swagger文件启动Mock Server'.green);
              runMockServer(mockFilePath, port);
            }
          })
        } else {
          if (port) {
            console.log('使用'+ swaggerFile +'文件启动Mock Server'.green);
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
        //middleware.parseRequest(),
        // middleware.validateRequest(),
        middleware.mock()
    );

    app.listen(port, function () {
      console.log('The mock server is now running at http://localhost:'+ port);
    });
  });
}
