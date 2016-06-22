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

function outputFile(outPath, apiName, str) {
    fs.outputFile(path.join(outPath, apiName + '.js'), str, function (err) {
        if (err) {
            throw err;
        }
        console.log('生成API成功!'.green);
    })
}

function getFilePath (customTplPath) {
    if (/(^\/|[a-zA-Z]:).+$/.test(customTplPath)) {
        return customTplPath;
    } else {
        return path.join(cwd, customTplPath);
    }
}

module.exports = function (config) {
    var configObj = getConfig(config);
    //console.log(configObj);
    //var filePath = configObj.config.file;
    var outPath = configObj.config.outPath;
    var apiName = configObj.config.apiName;
    var type = configObj.config.type;
    var surroundMode = configObj.config.surroundMode;
    var customTplPath = configObj.config.customTplPath;
    var filePath = '';
    if (customTplPath) {
        filePath = getFilePath(customTplPath);
    } else {
        filePath = path.join(__dirname, '../../templates/api-tpls/' + type + '-template.juicer');
    }
    juicerAdapter(filePath, configObj, function (err, str) {
        if (err) throw err;
        if (customTplPath || !surroundMode) {
            outputFile(outPath, apiName, str);
        } else {
            juicerAdapter(path.join(__dirname, '../../templates/api-tpls/surrounds/' + type + '/' + surroundMode + '-box-template.juicer'), configObj, function (subErr, subStr) {
                if (subErr) throw subErr;
                str = str.replace(/\n(.)/g, function (s1, s2) {
                    return '\n    ' + s2;
                });
                var subArr = subStr.split('// 子模板替换位置');
                subStr = subArr[0] + str + subArr[1];
                outputFile(outPath, apiName, subStr);
            });
        }
    });
};