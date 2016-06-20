/**
 * Created by liangkuaisheng on 16/6/12.
 */
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var colors = require('colors');
var requestSyncWin = require('request-sync-win');
var cwd = process.cwd();

var defaultConfig = {
    "file": "./swagger.json",
    "outPath": "./",
    "apiName": "ApiService",
    "type": "ng-http"
};

module.exports = function (config) {
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

    var nowDate = new Date();
    config.createTime = nowDate.toLocaleString('zh-cn', {
        hour12: false
    });

    swagger.apiName = config.apiName;
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
    var domain = '';
    if (swagger.host) {
        domain = schemesStr + '://' + swagger.host;
    }
    var basePath = swagger.basePath || '';
    if (basePath && /^.*\/$/.test(basePath)) {
        basePath = basePath.replace(/(^.*)(\/)$/, function (s1, s2) {
            return s2;
        });
        if (basePath.length === 1 && basePath === '/') {
            basePath = '';
        }
    }
    swagger.domain = domain;
    swagger.basePathNew = basePath;
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
        headerArr.unshift('{');
        headerArr.push('}');
        res = headerArr.join('');
    }
    return res;
}