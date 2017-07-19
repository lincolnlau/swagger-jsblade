var createResource = require('../api-creators/createResource.js');

module.exports = {
    create: create
};

function getType (options) {
    var res = {
        type: 'ng-http',
        importName: 'angular',
        exportName: 'angular'
    };
    switch (options.ajax) {
        case 's':
            res = {
                type: 'superagent',
                importName: 'superagent',
                exportName: 'superagent'
            };
            break;
        case 'a':
            res = {
                type: 'axios',
                importName: 'axios',
                exportName: 'axios'
            };
            break;
        case 'f':
            res = {
                type: 'fetch',
                importName: 'fetch',
                exportName: 'fetch'
            };
            break;
        case 'b':
            res = {
                type: 'superbridge',
                importName: '@hfe/superbridge',
                exportName: 'superbridge'
            };
            break;
        case 'c':
            res = {
                type: 'config',
                importName: '',
                exportName: ''
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

function create (apiName, swaggerFile, toPath, outFileName, options, cb) {
    //console.log(apiName, swaggerFile, toPath, options.ngHttp, options.resource);

    var typeObj = getType(options);
    createResource({
        "file": swaggerFile,
        "outPath": toPath,
        "apiName": apiName,
        "outFileName": outFileName,
        "type": typeObj.type,
        "importName": typeObj.importName,
        "exportName": typeObj.exportName,
        "surroundMode": getSurroundMode(options),
        "customTplPath": options.custom,
        "promiseInject": options.promise,
        "withCredentials": options.withCredentials,
        "bladeVersion": options._version,
        "tagsArr": getTags(options.tags)
    });
}
