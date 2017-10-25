/**
 * Created by liangkuaisheng on 16/6/12.
 */
var path = require('path');
var fs = require('fs-extra');
var colors = require('colors');
var juicerAdapter = require('juicer-express-adapter');
//juicer.set({
//    'strip': false,
//    'cache': false
//});
//var getConfig = require('./getConfig.js');
var getConfig = require('./getConfigData.js');
var cwd = process.cwd();
var _ = require('lodash');

function outputFile(outPath, outFileName, str) {
    var filePath = path.join(outPath, outFileName + '.js');
    fs.outputFile(filePath, str, function (err) {
        if (err) {
            throw err;
        }
        console.log(('生成API成功!文件位置: ' + filePath).green);
    })
}

function getFilePath (customTplPath) {
    if (/(^\/|[a-zA-Z]:).+$/.test(customTplPath)) {
        return customTplPath;
    } else {
        return path.join(cwd, customTplPath);
    }
}

function outPutApiFile(_configObj, outPath, _apiName, type, surroundMode, customTplPath, filePath, _outFileName, tagName) {
    var apiName = _.kebabCase(_apiName);
    var outFileName = _outFileName || apiName;
    var configObj = _.cloneDeep(_configObj);
    // 按tags分组
    if (tagName) {
        // apiName += '-' + _.kebabCase(tagName);
        outFileName += '-' + _.kebabCase(tagName);
        configObj.swagger.paths = configObj.swagger.pathsWithTags[tagName];
    }
    configObj.config.tagName = tagName || '';
    configObj.config.apiName = _apiName + _.upperFirst(_.camelCase(tagName));
    //outputFile('./temp', 'config.json', JSON.stringify(configObj, null, '    '));
    juicerAdapter(filePath, configObj, function (err, str) {
        if (err) throw err;
        if (customTplPath || !surroundMode) {
            outputFile(outPath, outFileName, str);
        } else {
            juicerAdapter(path.join(__dirname, '../../templates/api-tpls/surrounds/' + surroundMode + '-box-template.juicer'), configObj, function (subErr, subStr) {
                if (subErr) throw subErr;
                str = str.replace(/\n(.)/g, function (s1, s2) {
                    return '\n    ' + s2;
                });
                var subArr = subStr.split('// 子模板替换位置');
                subStr = subArr[0] + str + subArr[1];
                outputFile(outPath, outFileName, subStr);
            });
        }
    });
}

module.exports = function (config) {
    var configObj = getConfig(config);
    var outPath = configObj.config.outPath;
    var apiName = configObj.config.apiName;
    var outFileName = configObj.config.outFileName;
    var type = configObj.config.type;
    var surroundMode = configObj.config.surroundMode;
    var customTplPath = configObj.config.customTplPath;
    var tagsArr = configObj.config.tagsArr;
    var filePath = '';
    var swaggerTags = configObj.swagger.tags || [];
    if (customTplPath) {
        filePath = getFilePath(customTplPath);
    } else {
        filePath = path.join(__dirname, '../../templates/api-tpls/' + type + '-template.juicer');
    }
    if (!tagsArr) {
        outPutApiFile(configObj, outPath, apiName, type, surroundMode, customTplPath, filePath, outFileName);
    } else {
        if (tagsArr.length === 0) {
            swaggerTags.forEach(function (tagItem, index) {
                if (tagItem.name) {
                    tagsArr.push(tagItem.name);
                }
            });
        }
        tagsArr.forEach(function (item, index) {
            outPutApiFile(configObj, outPath, apiName, type, surroundMode, customTplPath, filePath, outFileName, item);
        });
    }
};