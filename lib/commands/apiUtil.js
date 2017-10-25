var createApiUtil = require('../api-creators/createApiUtil.js');

module.exports = {
    create: create
};

function getType (options) {
    var res = {
        type: 'axios',
        importName: 'axios',
        exportName: 'axios'
    };
    switch (options.ajax) {
        case 'a':
            res = {
                type: 'axios',
                importName: 'axios',
                exportName: 'axios'
            };
            break;
        default:
            break;
    }
    return res;
}

function getSurroundMode (options) {
    var res = '';
    var surround = options.surround;
    if (typeof surround !== 'undefined') {
        switch (surround) {
            case '1':
                res = 'umd';
                break;
            case '2':
                res = 'amd';
                break;
            case '3':
                res = 'commonjs';
                break;
            case '4':
                res = 'fn';
                break;
            case '5':
                res = 'es6';
                break;
            default:
                res = 'fn';
                break;
        }
    }
    return res;
}

function getTags (tags) {
    var res = null;
    var arr = [];
    if (tags) {
        res = [];
        arr = tags.split('@');
        arr.forEach(function (item, index) {
            if (item) {
                res.push(item);
            }
        });
    }
    return res;
}

function create (toPath, outFileName, options, cb) {
    //console.log(apiName, swaggerFile, toPath, options.ngHttp, options.resource);

    var typeObj = getType(options);
    createApiUtil({
        "outPath": toPath,
        "outFileName": outFileName || 'ApiUtil',
        "type": typeObj.type,
        "importName": typeObj.importName,
        "exportName": typeObj.exportName,
        "surroundMode": getSurroundMode(options),
        "bladeVersion": options._version
    });
}
