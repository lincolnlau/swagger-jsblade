var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var mockGenByCases = require('swagger-mock-file-generator-by-cases');
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
var createConfigQuestion = { name: 'create', message: '是否需要生成默认配置文件?', type: 'confirm', default: true };
var useDefaultQuestion = { name: 'useDefault', message: '是否需要使用默认配置文件?', type: 'confirm', default: true };

function create(swaggerFile, options, cb) {
    mock.swaggerFilePath = swaggerFile;
    mock.options = options;
    mock.cb = cb;
    var mockFilePath = options.file;
    var port = options.server;

    if (!/(\.json|\.yaml)$/.test(swaggerFile)) {
        console.log('需要json或yaml格式的swagger文件'.red);
        throw new Error();
    } else {
        fs.access(swaggerFile, fs.R_OK, function(err) {
            if (err) {
                console.log(swaggerFile + '该swagger文件不存在或无读权限'.red);
                throw new Error();
            } else {
                if (mockFilePath) {
                    mockGen(swaggerFile, mockFilePath, function(err) {
                        if (err) throw err;
                        mockConfig(mock.options);
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

function mockGenByCaseFunc () {
    var config = require(path.resolve(mock.configFilePath));
    if (config.mockDir) {
        var mockDir = `./${config.mockDir}/`;
        if (!fs.existsSync(mockDir)) {
            try {
                fs.mkdirSync(mockDir);
                questionAndGen(mockDir);
            } catch (error) {
                console.log('配置文件中的mockDir设置无效'.red);
                runMockServer(mock.swaggerFilePath, mock.options.server);
                return;
            }
        } else {
            questionAndGen(mockDir);
        }
    } else {
        // no matter what happens
        // run mock server
        runMockServer(mock.swaggerFilePath, mock.options.server);
    }
}

function questionAndGen(mockDir) {
    var mockFileByCasesQuestion = { name: 'mock', message: `是否以${mockDir}文件夹初始化swagger文件的mock数据?`, type: 'confirm', default: true };
    inquirer.prompt(mockFileByCasesQuestion).then(function(answers) {
        if (answers.mock) {
            mockGenByCases(mock.swaggerFilePath, mockDir, function(err) {
                if (err) throw err;
                runMockServer(mock.swaggerFilePath, mock.options.server);
            })
        } else {
            runMockServer(mock.swaggerFilePath, mock.options.server);
        }
    })
}

function mockConfig(options) {
    var configPath = options.config || '';
    var hasLite = options.lite;
    var mockFilePath = options.file;
    var port = options.server;
    var defaultConfigPath = path.resolve(path.join(mockFilePath, '..') + '/mock.config.js');
    mock.configFilePath = configPath;
    //默认文件是否存在
    if (!configPath && !hasLite) {
        if (!fs.existsSync(defaultConfigPath)) {
            inquirer.prompt(createConfigQuestion).then(function(answers) {
                if (answers.create) {
                    mock.configFilePath = defaultConfigPath;
                    fs.writeFile(mock.configFilePath, '', (err) => {
                        if (err) throw err;
                        var mockCB = mockGenByCaseFunc();
                        createDefaultConfigFile(mockCB);
                    });
                } else {
                    Finder.from(path.join(options.file, '..')).findFiles('mock.config.js', function(files) {
                        if (files) {
                            inquirer.prompt(useDefaultQuestion).then(function(answers) {
                                if (answers.useDefault) {
                                    // 默认路径
                                    configPath = files[0];
                                    mock.configFilePath = configPath;
                                    mockGenByCaseFunc();
                                } else {
                                    runMockServer(mock.swaggerFilePath, mock.options.server);
                                }
                            });
                        } else {
                            runMockServer(options.file, options.server);
                        }
                    });
                }
            });
        } else {
            // 找到默认配置文件
            mock.configFilePath = defaultConfigPath;
            mockGenByCaseFunc();
        }
    } else if (configPath && !hasLite) {
        mockGenByCaseFunc();
    } else {
        runMockServer(options.file, options.server);
    }
    return configPath;
}

function runMockServer(swaggerFile, port) {
    var swagger = swaggerFile;
    var port = isNaN(parseInt(port)) ? 8000 : parseInt(port);
    // Set the DEBUG environment variable to enable debug output
    process.env.DEBUG = 'swagger:middleware';
    var app = express();
    middleware(swagger, app, function(err, middleware) {
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

        mock.server = app.listen(port, function() {
            openHotReload();
            console.log('The mock server is now running at http://localhost:' + port);
        });
    });
}

function openHotReload() {
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

function createDefaultConfigFile(cb) {
    if (!mock.configFilePath) {
        console.log('读取默认配置文件路径出错'.red);
        cb(mock.options.file, mock.options.server);
    } else {
        var config = getConfig({ file: mock.swaggerFilePath });
        if (config && config.swagger && config.swagger.paths) {
            juicerAdapter(path.join(__dirname, '../../templates/mock/config-template.juicer'), config, function(err, str) {
                outPutFile(mock.configFilePath, str, cb);
            })
        } else {
            cb(mock.options.file, mock.options.server);
            console.log('读取swagger文件配置出错'.red);
        }
    }
}

function outPutFile(filePath, str, cb) {
    fs.outputFile(filePath, str, function(err) {
        if (err) {
            throw err;
        }
        cb(mock.options.file, mock.options.server);
        console.log(('生成默认配置文件成功!文件位置: ' + filePath).green);
    })
}
