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

var _ = require('lodash');

function outputFile(outPath, outFileName, str) {
    var filePath = path.join(outPath, outFileName + '.js');
    fs.outputFile(filePath, str, function (err) {
        if (err) {
            throw err;
        }
        console.log(('生成API 调用工具成功!文件位置: ' + filePath).green);
    })
}

function outPutApiFile(_configObj, outPath, surroundMode, filePath, outFileName) {
    var configObj = _.cloneDeep(_configObj);

    juicerAdapter(filePath, configObj, function (err, str) {
        if (err) throw err;
        if (!surroundMode) {
            outputFile(outPath, outFileName, str);
        } else {
            juicerAdapter(path.join(__dirname, '../../templates/api-tpls/util-tpls/surrounds/' + surroundMode + '-box-template.juicer'), configObj, function (subErr, subStr) {
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
    var configObj = {};
    configObj.config = config;
    var outPath = configObj.config.outPath;
    var outFileName = configObj.config.outFileName;
    var type = configObj.config.type;
    var surroundMode = configObj.config.surroundMode;
    var filePath = path.join(__dirname, '../../templates/api-tpls/util-tpls/' + type + '-util-template.juicer');

    outPutApiFile(configObj, outPath, surroundMode, filePath, outFileName);
};