# swagger-jsblade

[![npm version](https://img.shields.io/npm/v/swagger-jsblade.svg?style=flat)](https://www.npmjs.com/package/swagger-jsblade)[![NPM downloads](http://img.shields.io/npm/dm/swagger-jsblade.svg)](https://npmjs.org/package/swagger-jsblade)[![Join the chat at https://gitter.im/jsblade/Lobby](https://badges.gitter.im/swagger-jsblade/jsblade.svg)](https://gitter.im/jsblade/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## English Version
If you find README of english version ,click [HERE](https://github.com/lincolnlau/swagger-jsblade/blob/master/README_EN.md).

## 介绍

Jsblade是专为前端开发者提供的基于Swagger接口定义来使用的前端自动化工具。
主要解决下面几个问题：

* 项目模板
* 基于内置模板和自定义模板生成API调用文件
* 自动生成Mock服务端，提供模拟数据。

关于Swagger™是什么？可以参考 (Swagger官网)[http://swagger.io/]



## 安装
```shell
npm i swagger-jsblade -g
```
### 生成项目的例子
```shell
blade create myProject -f vue
```

| 命令 | 参数 | 功能描述 |
| --- | --- | ---
| -f, —-framework| 'angular1' , 'vue' |内置了angular1.x 和vue1.x的项目模板|

**详细用法e**

```shell
blade create -h
 Usage: create [options] [name]

  创建一个文件夹包含一个前端项目

  Options:

    -h, --help                   output usage information
    -f, --framework <framework>  angular1|vue 中的一个
```

### API 调用文件的使用例子
```
blade api DataApi ./input/swagger.json ./output/service dataApi
```
| 命令 | 参数 | 功能描述 |
| --- | --- | ---
| -a, —-ajax <type>| n, s|API的类型参数 : n为angular的$http; s是兼容Node或浏览器端的 superagent类型
| -s, —-surround <mode>| 1,2,3,4 |API文件的包裹模块类型: 1 是 UMD; 2 是 AMD; 3 是 CommonJS; 4 是 JavaScript closure
| -w, —-withCredentials |  |w是开启 CORS
| -t, —-tags <tagName>| 对应Swagger定义中的tagName |可以指定根据哪些tagName生成哪些API: @tagOne -> 生成tagName为tagOne的API. @tagOne@tagTwo -> 生成tagName为tagOne和tageTwo的API
| -p, —-promise |  |p开启Promise模式

**详细用法**

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

#### 使用生成的 API
**简单用法**

```javascript
import API from '../api/dataApi';

let api = new API('http://xxx.com');
// This will send an AJAX to http://xxx.com/xxx
api.xxxx(param).then(res => {
    console.log('get respone:' + res)
})
```
**支持Superagent/Superbridge/Fetch 拦截器**
仿照Angular的$http中的用法 , 增加支持superagent/superbridge/fetch类型的拦截器,
其中angular/axios库本身自己就含有拦截器。
可以如下来使用拦截器:

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

ApiUtil调用工具可用 blade util命令生成

###API调用文件的生成
```shell
blade util -h

  Usage: util [options] <toPath> [outFileName]

  创建一个api调用工具
  必填:<输出文件位置> [输出文件名称,默认ApiUtil]


  Options:

    -a, --ajax <type>      发送请求类型, a: axios类型, 目前只支持axios类型
    -s, --surround <mode>  包围模式, 将生成的代码包含在UMD-1 AMD-2 CommonJS-3 闭包-4 ES6-5 中
    -V, --version          output the version number
    -h, --help             output usage information

```
### Mock 功能的使用例子
#### 生成Mock数据

```shell
blade mock ./input/swagger.json -f ./output/swagger.mock.json
```
模拟数据会已当前的swagger定义，填充返回值定义schema里的example属性 ```responses.[code].schema.example```
```
```
如果你的swagger定义文件本身就含有定义好的example属性，在生成数据时会优先使用该gaexample，如果没有定义就会随机生成，目前默认字符串类型会以当前的key名来生成。

#### 启动Mock server

```
blade mock ./input/swagger.json -s 8001
```
| 命令 | 参数 | 功能描述 |
| --- | --- | ---
| -f, —-file <swagger文件>| 文件路径|生成出含有随机值example的新swagger定义文件
| -s, —-server <端口号>|  端口号|指定启动mock server的端口号，默认为8000
| -c, —-config <mock配置文件>|配置文件路径| mock 2.0中新增: 指定自定义的配置文件，如果不指定就会在当前目录下自动生成默认名为'mock.config.js'的配置文件
| -l, —-lite||不启用 mock 2.0功能的默认提示

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

#### Mock 2.0高级功能的使用
由于目前Swagger2.0规范中对同一个HTTP状态码无法定义多返回值的问题，我们在Mock2.0新增生成外置的本地Mock文件
文件名格式为
```
-- mock （存放外置文件的目录）
|- path-api-v1-api1.json （对应API为path/api/v1/api1的）
|- path-api-v1-api2.json （对应API为path/api/v1/api2）
```
生成的文件格式为
```json
{"cases": [{example: '模拟数据1'},{example: '模拟数据2'}]}
```
默认会基于Swagger当前接口返回值生成仅一个模拟数据，如需增加可在cases数组中逐个添加，并在mock.config.js中启用对应的接口。

mock.config.js格式如下

```javascript
module.exports = {
    mockDir: './mock/',
    basePath: '/xx',
    path: {
        '/api/v1/xxx': 0,// cases index 默认为0代表不读取此接口对应的本地文件, 1则为读取cases中第1个模拟返回值, n则为第cases[n-1]个模拟返回值
    },
  /**
    * Proxy [Object]: {path: Object} Set the proxy rule, keys are the path for matching, the value should a object to set the detail matching rules.
    * @path [string]: Path that matching, can use glob pattern for matching.
    *   Example:
    *     '/api': matches paths starting with /api
    *     '**': matches any path
    *     '/api/*.html': matches any path ending with .html in the path of /api
    *     '/api/**': matches any path starting with /api
    * @path.target [string]: set the target host. The scheme is necessary (such as 'http://' or 'http://'), even if the target is a IP address, it should write with the shcema.
    * @path.debug [Boolean]: whether print Http headers or not. default false
    * @path.headers [Object]: set fields in the request headers.
    * @path.headers.cookie [String]: set the cookie field in the request headers
    * @path.headers.host [String]: set the host field in the request headers
    */
    proxy: {
        '/path/**': {
            target: 'http://target.com:80',
            debug: false,
            headers: {
                cookie: 'ssoid=12345678*abcdefg;',
                host: 'target.com'
            }
        }
    }
}

```
目前没有对Restful API的Request Method做明显区分，初衷是方便开发者能够快速使用Mock的数据，可以在文件里定义多个场景下不同的返回值

我们在Mock server中内封装了与webpack-dev-server的proxy同样的功能，详细使用方法可见[webpack-dev-server proxy](https://doc.webpack-china.org/configuration/dev-server/#devserver-proxy)

## Changelog
Detailed changes for each release are documented in the [release notes](https://github.com/lincolnlau/swagger-jsblade/releases).

## FAQ
We have collected some [frequently asked questions](https://github.com/lincolnlau/swagger-jsblade/blob/master/FAQ.md). Before reporting an issue, please search if the FAQ has the answer to your problem.

## LICENSE
MIT

