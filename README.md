# swagger-jsblade

[![npm version](https://img.shields.io/npm/v/swagger-jsblade.svg?style=flat)](https://www.npmjs.com/package/swagger-jsblade)[![NPM downloads](http://img.shields.io/npm/dm/swagger-jsblade.svg)](https://npmjs.org/package/swagger-jsblade)[![Join the chat at https://gitter.im/jsblade/Lobby](https://badges.gitter.im/swagger-jsblade/jsblade.svg)](https://gitter.im/jsblade/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Introduction

Jsblade is a tool kit for Front-End developers who use Swagger as their API definition.
These are the main it solved.

* Boilerplate
* Auto generate API based built-in templates and custom template
* Auto mock API and custom mock response

For complete information about Swagger™, you can check the Swagger Specification project. It contains general information and the actual Swagger specification.


## Install
```shell
npm i swagger-jsblade -g
```
### Boilerplate Example
```shell
blade create myProject -f vue
```

| Command | Options | Description |
| --- | --- | ---
| -f, —-framework| 'angular1' , 'vue' |Built-in Angular 1.5.x and Vue 1.x project bolierplate|

**Detail Usage**

```shell
blade create -h
 Usage: create [options] [name]

  创建一个文件夹包含一个前端项目

  Options:

    -h, --help                   output usage information
    -f, --framework <framework>  angular1|vue 中的一个
```

### API Generation Example
```
blade api DataApi ./input/swagger.json ./output/service dataApi
```
| Command | Options | Description |
| --- | --- | ---
| -a, —-ajax <type>| n, s|generated API type : n for angular's $http; s for NodeJS or browser's superagent
| -s, —-surround <mode>| 1,2,3,4 |API Module: 1 for UMD; 2 for AMD; 3 for CommonJS; 4 for JavaScript closure
| -w, —-withCredentials |  |Enable CORS
| -t, —-tags <tagName>| Swagger definition's tagName |Only generate API based on tagName: @tagOne -> generate tagOne. @tagOne@tagTwo -> generate both tagOne and tageTwo
| -p, —-promise |  |Enable Promise

**Detail Usage**

```shell
blade api -h

  Usage: api [options] <apiName> <swaggerFile> <toPath> [outFileName]

  创建一个api接口集合
  必填:<api名称> <swagger文件位置,支持本地和线上> <输出文件位置> [输出文件名称]


  Options:

    -a, --ajax <type>       发送请求类型(-c时无效), n: $http类型, s: superagent类型, f: fetch类型, a: axios类型, b: superbridge类型, c: config类型,只生成配置
    -s, --surround <mode>   包围模式(-c时无效), 将生成的代码包含在UMD-1 AMD-2 CommonJS-3 闭包-4 ES6-5 中
    -c, --custom <tplPath>  自定义模板(优先级高于 -a和-s)
    -w, --withCredentials   支持跨域传cookie
    -t, --tags <tagName>    按tag分组生成文件,(@)生成全部tag的, (@aaa@bbb)生成aaa和bbb的
    -p, --promise           注入Promise依赖,默认不注入
    -V, --version           output the version number
    -h, --help              output usage information
```

#### Using API
**Simple Usage**

```javascript
import API from '../api/dataApi';

let api = new API('http://xxx.com');
// This will send an AJAX to http://xxx.com/xxx
api.xxxx(param).then(res => {
    console.log('get respone:' + res)
})
```
**Superagent/Superbridge/Fetch Interceptor Enhanced**
like Angular's $http , we add an interceptor to superagent/superbridge/fetch type API,
angular/axios has interceptor yet.
you can use it like this:

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

**如果生成的是cofig形式,可参照下面demo使用**
```
import ApiUtil from '@/common/services/ApiUtil';    // 引入工具包
import ApiConfig from '@/common/services/config';   // 引入生成的配置文件
import axios from 'axios';

axios.interceptors.request.use(function (config) {
    return config;
}, function (err) {
    return Promise.reject(err);
});
axios.interceptors.response.use(function (response) {
    return response;
}, function (err) {
    return Promise.reject(err);
});

export const Apis = new ApiUtil(ApiConfig, {
    domain: ''
});

export default Apis;
```

### Mock Example
#### Mock data generation

```
blade mock ./input/swagger.json -f ./output/swagger.mock.json
```
The mock data will generate at ```responses.[code].schema.example```
```
```
if your original swagger file has defined some example,will remain the same otherwhise random generate.

#### Mock server

```
blade mock ./input/swagger.json -s 8001
```
| Command | Options | Description |
| --- | --- | ---
| -f, —-file <mockFilePath>| file path|generate swagger mock file which definition's example is filled with random mock data
| -s, —-server <port>|  port number|mock server's port ,default is 8000
| -c, —-config <config file>|config file path| mock 2.0(v0.2.0) added: custom config file,default config will prompt whether generate at your project root dir, named with 'mock.config.js'
| -l, —-lite||disable mock 2.0 default prompt

**Detail Usage**

```shell
blade mock -h

 Usage: mock [options] <swaggerFile>

  生成含有mock数据的swagger文件 必填:<swagger文件位置,本地或线上yaml或JSON格式文件> <输出JSON文件位置及名称>

  Options:

    -h, --help               output usage information
    -f, --file <filePath>    生成mock file
    -s, --server [portNum]   启动mock server,端口号,默认8000
    -c, --config <filePath>  mock数据配置文件
    -l, --lite               不自动识别config文件

```
## Changelog
Detailed changes for each release are documented in the [release notes](https://github.com/lincolnlau/swagger-jsblade/releases).

## FAQ
We have collected some [frequently asked questions](https://github.com/lincolnlau/swagger-jsblade/blob/master/FAQ.md). Before reporting an issue, please search if the FAQ has the answer to your problem.

## LICENSE
MIT