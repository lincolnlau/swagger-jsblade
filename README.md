# swagger-jsblade
```
  Usage: blade [options] [command]


  Commands:

    create [options] [name]     创建一个文件夹包含一个前端项目
          Usage: create [options] [name]
        
          创建一个文件夹包含一个前端项目
        
          Options:
        
            -h, --help                   output usage information
            -f, --framework <framework>  angular1|vue 中的一个

    api [options] <apiName> <swaggerFile> <toPath> [outFileName]  创建一个api接口集合 必填:<api名称> <swagger文件位置,支持本地和线上> <输出文件位置> [输出文件名称]
          Usage: api [options] <apiName> <swaggerFile> <toPath> [outFileName]
        
          创建一个api接口集合
          必填:<api名称> <swagger文件位置,支持本地和线上> <输出文件位置> [输出文件名称]
        
          Options:
        
            -h, --help              output usage information
            -a, --ajax <type>       发送请求类型(-c时无效), n: $http类型, s: superagent类型
            -s, --surround <mode>   包围模式(-c时无效), 将生成的代码包含在UMD-1 AMD-2 CommonJS-3 或 闭包-4 中
            -c, --custom <tplPath>  自定义模板(优先级高于 -a和-s)
            -w, --withCredentials   支持跨域传cookie
            -t, --tags <tagName>    按tag分组生成文件,(@)生成全部tag的, (@aaa@bbb)生成aaa和bbb的
            -p, --promise           注入Promise依赖,默认不注入

    mock [options] <swaggerFile>    生成含有mock数据的swagger文件 必填:<swagger文件位置,本地或线上yaml或JSON格式文件> <输出JSON文件位置及名称>
          Usage: mock [options] <swaggerFile>
        
          生成含有mock数据的swagger文件 必填:<swagger文件位置,本地或线上yaml或JSON格式文件> <输出JSON文件位置及名称>
        
          Options:
        
            -h, --help              output usage information
            -f, --file <filePath>   生成mock file
            -s, --server [portNum]  启动mock server,端口号,默认8000

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

```

#### 生成的api, -a s方式的是superagent类型,可以添加钩子(hook),支持返回数据和promise两种形式
```
import API from '../api/dataApi';

API.interceptor({
    request: function (config) {
        console.log(config);
        return (new Promise(function (resolve, reject) {
            resolve(config);
        }));
    },

    requestError: function (err) {
        console.log(err);
        return (new Promise(function (resolve, reject) {
            resolve(err);
        }));
    },

    response: function (response) {
        console.log(response);
        return (new Promise(function (resolve, reject) {
            resolve(response);
        }));
    },

    responseError: function (err) {
        console.log(err);
        return (new Promise(function (resolve, reject) {
            resolve(err);
        }));
    }
});

let api = new API('http://xxx.com');
```