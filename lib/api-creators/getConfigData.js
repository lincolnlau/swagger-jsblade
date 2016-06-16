/**
 * Created by liangkuaisheng on 16/6/12.
 */
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var colors = require('colors');
var requestSyncWin = require('request-sync-win');
var cwd = process.cwd();

var defaultDep = {
    "resource": [
        {
            "name": "angular"
        },
        {
            "name": "angular-resource"
        }
    ],
    "ng-http": []
};
var defaultConfig = {
    "file": "./swagger.json",
    "outPath": "./",
    "apiName": "ApiService",
    "type": "ng-http"
};

module.exports = function (config) {
    defaultConfig.dependence = defaultDep[config.type || defaultConfig.type];
    config = _.defaultsDeep(config, defaultConfig);

    var swagger;
    var fileName = config.file;
    try {
        if (/^(http|https):\/\/.+/gi.test(fileName)) {
            var httpRes = requestSyncWin(fileName);
            if (httpRes.statusCode === 200) {
                swagger = JSON.parse(httpRes.body);
            } else {
                throw new Error('http code=' + httpRes.statusCode);
            }
        } else {
            swagger = require(path.join(cwd, fileName));
        }
    } catch (err) {
        console.log('没有swagger文件或文件不是合法json格式'.red);
        throw err;
    }

    // 依赖注入
    var dependenceArr = [];
    var requireArr = [];
    var rootArr = [];
    var paramsArr = [];
    _.forEach(config.dependence, function (value, key) {
        value.exports = value.exports || _.camelCase(value.name);
        dependenceArr.push("'" + value.name + "'");
        requireArr.push("require('" + value.name + "')");
        rootArr.push('root.' + value.exports);
        paramsArr.push(value.exports);
    });

    config.dependenceObj = {
        dependence: dependenceArr.join(',\n            '),
        require: requireArr.join(',\n            '),
        root: rootArr.join(',\n            '),
        params: paramsArr.join(',\n    ')
    };
    var nowDate = new Date();
    config.createTime = nowDate.toLocaleString();

    swagger.apiName = config.apiName;
    swagger.dependence = config.dependence;
    swagger.pathsUrl = {};
    _.forEach(swagger.paths, function (value, key) {
        _.forEach(value, function (item, index) {
            // 方法名
            item.fnName = _.camelCase(index + key);
            // 处理restful风格url
            swagger.pathsUrl[key] = key.replace(/\{([^\{\}]+)\}/gi, function (s1, s2) {
                return ':' + s2;
            });
            if (_.findLastKey(swagger.paths) === key && _.findLastKey(value) === index) {
                // 最后一个方法没有逗号
                item.lastOneReq = true;
            }
            // 处理header
            if (needSetFormData(item.consumes)) {
                item.transformRequestAsForm = true;
                item.transformRequestFormData = true;
            }
            _.forEach(item.parameters, function (param, pKey) {
                if (param.in === 'formData') {
                    item.transformRequestAsForm = true;
                    if (param.type === 'file') {
                        item.transformRequestFormData = true;
                    }
                }
                if (param.in === 'header') {
                    item.hasInHeader = true;
                }
                if (param.in === 'body') {
                    item.hasInBody = true;
                }
            });
            item.headerStr = getHeader(item);
        });
    });

    // 处理basePath
    var schemes = swagger.schemes;
    var schemesStr = 'http';
    if (schemes && schemes.length > 0) {
        schemesStr = schemes[0];
    }
    var urlPre = ((schemesStr + '://' + swagger.host) || '') + (swagger.basePath || '');
    if (urlPre && /^.*\/$/.test(urlPre)) {
        urlPre = urlPre.replace(/(^.*)(\/)$/, function (s1, s2) {
            return s2;
        })
    }
    swagger.urlPre = urlPre;
    return {
        config: config,
        swagger: swagger
    }
};

/*
* 判断头部是否含有 consumes:["multipart/form-data"]
* */
function needSetFormData(consumes) {
    if (!consumes) {
        return false;
    }
    var res = false;
    consumes.forEach(function (item, index) {
        if (item === 'multipart/form-data') {
            res = true;
        }
    });
    return res;
}

/*
* 设置头部
* */
function getHeader(req) {
    var res = '';
    var headerArr = [];
    var headerObj = {};
    if (req.produces) {
        headerObj['Accept'] = "'" + req.produces.join(', ') + "'";
    }
    if (req.consumes) {
        headerObj['Content-Type'] = "'" + req.consumes.join(', ') + "'";
    }
    if (req.transformRequestAsForm) {
        headerObj['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
    }
    if (req.transformRequestFormData) {
        headerObj['Content-Type'] = undefined;
    }
    Object.keys(headerObj).forEach(function (key, index) {
        var item = headerObj[key];
        headerArr.push("'" + key + "': " + item);
    });
    if (headerArr.length > 0) {
        headerArr = [headerArr.join(',')];
        headerArr.unshift('\n            headers: {');
        headerArr.push('},');
        res = headerArr.join('');
    }
    return res;
}