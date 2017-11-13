var path = require('path');
var fs = require('fs-extra');
var cp = require('child_process');
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
var _ = require('lodash');

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
var createConfigQuestion = {
    name: 'create',
    message: '是否需要生成默认配置文件?',
    type: 'confirm',
    default: true
};
var useDefaultQuestion = {
    name: 'useDefault',
    message: '是否需要使用默认配置文件?',
    type: 'confirm',
    default: true
};
var updateConfigFileQuestion = {
    name: 'updateConfig',
    message: `是否增量更新mock config文件？`,
    type: 'confirm',
    default: true
};

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
                // 生成mock.json -f
                if (mockFilePath) {
                    mockGen(swaggerFile, mockFilePath, function (err) {
                        if (err) throw err;
                        console.log('含有mock数据的swagger文件生成成功:'+ mockFilePath.green);
                        mockConfig(mock.options);
                        // console.log('使用含有mock数据的swagger文件启动Mock Server'.green);
                    });
                } else {
                    mockConfig(mock.options);
                }
            }
        })
    }
}

function runMockServer(swaggerFile, port) {
    var swagger = swaggerFile;
    var port = isNaN(parseInt(port)) ? 8000 : parseInt(port);
    // Set the DEBUG environment variable to enable debug output
    process.env.DEBUG = 'swagger:middleware';
    var app = express();
    if (mock.options.file) return;
    var proxyMiddlewareList = proxyMiddleware(mock.configFilePath);
    middleware(swagger, app, function(err, middleware) {
        app.use(
            middleware.metadata(),
            middleware.CORS(),
            middleware.files(),
            // middleware.validateRequest(),
            apiCasesMiddleware(mock.configFilePath),
            proxyMiddlewareList,
            middleware.parseRequest(),
            middleware.mock()
        );

        mock.server = app.listen(port, function() {
            openHotReload();
            console.log('Mock Server 运行在 http://localhost:' + port);
        });
    });
}

function mockConfig(options) {
    var configPath = options.config || '';
    var hasLite = options.lite;
    var mockFilePath = options.file;
    var port = options.server;
    var hasInclude = options.include;
    var defaultConfigPath = path.resolve('./mock.config.js');
    mock.configFilePath = configPath;
    //默认文件是否存在
    if (!configPath && !hasLite) {
        if (!fs.existsSync(defaultConfigPath)) {
            // 无默认mock.config.js文件
            inquirer.prompt(createConfigQuestion).then(function(answers) {
                if (answers.create) {
                    // 同意自动生成mock.config.js
                    mock.configFilePath = './mock.config.js';
                    fs.writeFile(mock.configFilePath, '', (err) => {
                        if (err) throw err;
                        createDefaultConfigFile();
                        if (hasInclude) {
                            fileMergeConfig(options.include); //多swagger文件合并到config
                        }
                    });
                } else {
                    // 不同意自动生成，需先遍历查找
                    Finder.from(path.join('..')).findFiles('mock.config.js', function(files) {
                        if (files.length) {
                            // 在别的目录下有 mock.config.js 文件
                            inquirer.prompt(useDefaultQuestion).then(function(answers) {
                                if (answers.useDefault) {
                                    // 同意使用该文件作为配置文件
                                    // 默认路径
                                    configPath = files[0];
                                    mock.configFilePath = configPath;
                                    if (hasInclude) {
                                        fileMergeConfig(options.include, mockGenByCaseFunc); //多swagger文件合并到config
                                    } else {
                                        mockGenByCaseFunc();
                                    }

                                } else {
                                    // 不使用找到的config文件，无config启动
                                    mock.configFilePath = '';
                                    runMockServer(mock.swaggerFilePath, mock.options.server);
                                }
                            });
                        } else {
                            // 不同意生成，且无mock.config.js文件，则无config启动
                            mock.configFilePath = '';
                            runMockServer(options.file, options.server);
                        }
                    });
                }
            });
        } else {
            // 找到默认配置文件
            mock.configFilePath = defaultConfigPath;
            if (hasInclude) {
                fileMergeConfig(options.include, mockGenByCaseFunc); //多swagger文件合并到config
            } else {
                mockGenByCaseFunc();
            }
        }
    } else if (configPath && !hasLite) {
        // 使用指定的 config 文件
        if (hasInclude) {
            fileMergeConfig(options.include, mockGenByCaseFunc); //多swagger文件合并到config
        } else {
            mockGenByCaseFunc();
        }
    } else {
        // 没有 config 直接起 server
        mock.configFilePath = '';
        runMockServer(options.file, options.server);
    }
    return configPath;
}
function fileMergeConfig (pathList, cb) {
    var existPath = [];
    var uniqPath;
    var pathKey; //接口path
    // 读取 includes 传入文件的 swagger 定义
    var config = getConfig({ file: mock.swaggerFilePath });
    // 将主文件与 includes 进来的文件一起遍历
    var swaggerFilesPaths = pathList.concat(mock.swaggerFilePath);
    //筛选存在的path
    swaggerFilesPaths.forEach((path) => {
        if (fs.existsSync(path)) {
            pathKey = getConfig({ file: path });
            if (pathKey.swagger && pathKey.swagger.paths) {
                existPath = existPath.concat(_.keys(pathKey.swagger.paths));
            }
        } else {
            console.log(`未找到${path}文件，读取该文件定义失败`.red);
        }
    });
    // 将去重过的 paths 数组传入 resetConfigFile 函数去更新配置文件
    if (_.uniq(existPath).length > 0) {
        inquirer.prompt(updateConfigFileQuestion).then(function(answers) {
            if (answers.updateConfig) {
                resetConfigFile(_.uniq(existPath), config, cb);
            } else {
                cb();
            }
        })
    }
}
function mockGenByCaseFunc () {
    var config = require(path.resolve(mock.configFilePath));
    if (mock.options.include) {
        mockGenByCaseCb(config)
    } else {
        updateConfigFile(config.path, mockGenByCaseCb(config));
    }
}
function mockGenByCaseCb (config) {
    if (config.mockDir) {
        var mockDir = config.mockDir;
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
    var mockFileByCasesQuestion = { name: 'mock', message: `是否以${mockDir}文件夹初始化或更新swagger文件的mock数据?`, type: 'confirm', default: true };
    inquirer.prompt(mockFileByCasesQuestion).then(function(answers) {
        if (answers.mock) {
            var paths = [mock.swaggerFilePath];
            if (mock.options.include) {
                paths = paths.concat(mock.options.include);
            }
            mockGenByCases(paths, mockDir, function(err) {
                if (err) throw err;
                runMockServer(mock.swaggerFilePath, mock.options.server);
            })
        } else {
            runMockServer(mock.swaggerFilePath, mock.options.server);
        }
    })
}

var oneprocess

function openHotReload() {
    var monitorPaths = [mock.swaggerFilePath, mock.configFilePath];
    monitorPaths.forEach((filePath) => {
        if (filePath && fs.existsSync(filePath)) {
           chokidar.watch(filePath).on('change', _.debounce(function (file) {
                oneprocess = cp.fork(file);
                mock.server.close();
                console.log('reload', file);
                if (mock.configFilePath && _.includes(mock.swaggerFilePath, file)) {
                    delete require.cache[path.resolve(mock.configFilePath)];
                    var config = require(path.resolve(mock.configFilePath));
                    updateConfigFile(config.path, () => {})
                } else {
                    reloadServer();
                }
            }, 500));
        }
    });
}

function reloadServer () {
    runMockServer(mock.file, mock.options.server);
    console.log('检测到文件变化，已重启Mock Server'.green);
    if (mock.configFilePath) {oneprocess = newProcess(oneprocess);}
}

process.on('SIGINT', () => {
    process.exit(0);
});

function newProcess (oneprocess) {
    oneprocess.kill('SIGINT');
    return cp.fork(mock.configFilePath);
}

function createDefaultConfigFile() {
    if (!mock.configFilePath) {
        console.log('读取默认配置文件路径出错'.red);
        runMockServer(mock.options.file, mock.options.server);
    } else {
        var config = getConfig({ file: mock.swaggerFilePath });
        if (config && config.swagger && config.swagger.paths) {
            config.pathObjects = []
            const paths =_.uniq(_.keys(config.swagger.paths));
            _.forEach(paths, (path) => {
                config.pathObjects.push({path: path, value: 0})
            })
            juicerAdapter(path.join(__dirname, '../../templates/mock/config-template.juicer'), config, function(err, str) {
                outPutFile(mock.configFilePath, str, '生成默认配置文件成功!文件位置: ');
            })
        } else {
            console.log('读取swagger文件配置出错'.red);
            runMockServer(mock.options.file, mock.options.server);
        }
    }
}
function resetConfigFile (paths, config, cb) {
    // 增量更新 mock config 文件函数
    // 先读取当前 config 文件中已有的配置
    var configFileObj = require(path.resolve(mock.configFilePath));
    var configFilePaths = configFileObj ? configFileObj.path : {} ;
    // 避免覆盖了已经写好的同名配置
    config.pathObjects = [];
    _.forEach(configFilePaths, (value, key) => {
        config.pathObjects.push({
            path: key,
            value: value
        })
    })
    var newPaths = [];
    if (config && config.swagger && config.swagger.paths) {
        _.forEach(paths,((value) => {
            // 将新增 path 追加到尾部，默认值0，不启用
            if (value && !_.includes(_.keys(configFilePaths), value)) {
                newPaths.push(value);
                config.pathObjects.push({path: value, value: 0});
            }
        }))
        juicerAdapter(path.join(__dirname, '../../templates/mock/config-template.juicer'), config, function(err, str) {
            outPutFile(mock.configFilePath, str, '更新配置文件成功', cb);
            if (newPaths.length) {
                console.log('本次增量更新的接口定义：'.green);
                newPaths.forEach((path) => console.log(`${path}`.green));
            }
        })
        if (mock.server) { reloadServer(); }
    }
}
function updateConfigFile (configPaths, cb) {
    var config = getConfig({ file: mock.swaggerFilePath });
    if (config && config.swagger && config.swagger.paths && needUpdateConfig(_.keys(config.swagger.paths), _.keys(configPaths))) {
        inquirer.prompt(updateConfigFileQuestion).then(function(answers) {
            if (answers.updateConfig) {
                resetConfigFile(_.keys(config.swagger.paths), config, cb);
            } else {
                cb();
            }
        })
    } else {
        cb();
    }
}

function needUpdateConfig (swagger, config) {
    let result = false;
    result = _.some(swagger, (item) => {
        return !_.includes(config, item)
    })
    return result;
}

function outPutFile(filePath, str, message, cb){
    fs.outputFile(filePath, str, function(err) {
        if (err) {
            throw err;
        }
        console.log((message + filePath).green);
        if (cb) {
            cb();
        } else {
            mockGenByCaseFunc(mock.options.file, mock.options.server)
        }
    })
}
