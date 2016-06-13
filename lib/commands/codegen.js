var createResource = require('../api-creators/createResource.js');

module.exports = {
    create: create
};

var ANGULAR_HTTP = 'ANGULAR_HTTP';
var SUPERAGENT = 'SUPERAGENT';

function create (names, swaggerFile, toPath, options, cb) {
    console.log(names, options);


    //createResource();
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