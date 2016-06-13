/**
 * 标题：          $${swagger.info.title}
 * 版本：          $${swagger.info.version}
 * 描述：          $${swagger.info.description}
 * 时间：          $${config.createTime}
 * swagger版本：   $${swagger.swagger}
 */
var app = angular.module('$${config.apiName}Module', [
    'ngResource'
]);

app.factory('$${config.apiName}', ['$resource', function ($resource) {
    return $resource('$${swagger.host}$${swagger.basePath}', {}, {
        // 例子
        // toDoExample: {
        //     url: '/todo_example',
        //     method: 'get'
        // },
{@each swagger.paths as path,index}
    {@each path as req,key}
        /*
        * $${req.description}
        * */
        $${req.fnName}: {
            url: '$${index}',
            method: '$${key}',
            transformRequest: [],
            transformResponse: []
        }{@if !req.lastOneReq},{@/if}
    {@/each}
{@/each}
    });
}]);