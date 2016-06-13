    var app = angular.module('$${config.apiName}Module', [
        'ngResource'
    ]);

    app.factory('$${config.apiName}', ['$resource', function ($resource) {
        return $resource('$${swagger.host}$${swagger.basePath}', {}, {
            // 例子
            // toDoExample: {
            //     url: '/todo_example',
            //     useLoader: false,  // 设置是否使用loader效果
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