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
var getConfig = require('./getConfig.js');
var cwd = process.cwd();

module.exports = function (filePath) {
    var configObj = getConfig(filePath || './code-gen.json');
    //console.log(configObj);
    var filePath = configObj.config.file;
    var outPath = configObj.config.outPath;
    var apiName = configObj.config.apiName;
    var type = configObj.config.type;
    juicerAdapter(path.join(__dirname, './templates/box-template.js'), configObj, function (err, str) {
        console.log(str);
        fs.outputFile(path.join(outPath, apiName + '.js'), str, function (err) {
            if (err) {
                throw err;
            }
            console.log('成功!'.green);
        })
    });
};