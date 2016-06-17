var createResource = require('../api-creators/createResource.js');

module.exports = {
    create: create
};

var ANGULAR_HTTP = 'ANGULAR_HTTP';
var SUPERAGENT = 'SUPERAGENT';

var TYPE_ARR = [
    'ng-http',
    'resource'
];

function getType (options) {
    if (options.ngHttp) {
        return TYPE_ARR[0];
    }
    if (options.resource) {
        return TYPE_ARR[1];
    }
    return 'default';
}

function create (apiName, swaggerFile, toPath, options, cb) {
    //console.log(apiName, swaggerFile, toPath, options.ngHttp, options.resource);

    createResource({
        "file": swaggerFile,
        "outPath": toPath,
        "apiName": apiName,
        "type": getType(options)
    });
}

/**
 * 生成代码
 *
 */
function generate (swaggerJson, type) {

    switch (type) {
        case ANGULAR_HTTP:
            genAngularHttp(swaggerJson);
            break;

        case SUPERAGENT:
            genSuperAgent(swaggerJson);
            break;
    }
}

/**
 * 生成angular http
 *
 */
function genAngularHttp (swaggerJson) {

}

/**
 * 生成 superagent
 *
 */
function genSuperAgent (swaggerJson) {

}