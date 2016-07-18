var createResource = require('../api-creators/createResource.js');

module.exports = {
    create: create
};

function getType (options) {
    var res = 'ng-http';
    switch (options.ajax) {
        case 's':
            res = 'superagent';
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

    createResource({
        "file": swaggerFile,
        "outPath": toPath,
        "apiName": apiName,
        "outFileName": outFileName,
        "type": getType(options),
        "surroundMode": getSurroundMode(options),
        "customTplPath": options.custom,
        "withCredentials": options.withCredentials,
        "tagsArr": getTags(options.tags)
    });
}
