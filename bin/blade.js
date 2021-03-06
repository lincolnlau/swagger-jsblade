#!/usr/bin/env node

'use strict';

var app =  require('commander');
var project = require('../lib/commands/project');
var codegen = require('../lib/commands/codegen');
var apiUtil = require('../lib/commands/apiUtil');
var mock = require('../lib/commands/mock');
var frameworks = Object.keys(project.frameworks).join('|');
var cli = require('../lib/util/cli');
var execute = cli.execute;
var appInfo = require('./../package.json');

app
    .version(appInfo.version);

app
  .command('create [name]')
  .description('创建一个文件夹包含一个前端项目')
  .option('-f, --framework <framework>', frameworks + " 中的一个" )
  .action(execute(project.create));

app
    .command('api <apiName> <swaggerFile> <toPath> [outFileName]')
    .description('创建一个api接口集合\n' +
        '  必填:<api名称> <swagger文件位置,支持本地和线上> <输出文件位置> [输出文件名称]')
    .option('-a, --ajax <type>', "发送请求类型(-c时无效), n: $http类型, s: superagent类型, f: fetch类型, a: axios类型, b: superbridge类型, c: config类型,只生成配置")
    .option('-s, --surround <mode>', "包围模式(-c时无效), 将生成的代码包含在UMD-1 AMD-2 CommonJS-3 闭包-4 ES6-5 中")
    .option('-c, --custom <tplPath>', "自定义模板(优先级高于 -a和-s)")
    .option('-w, --withCredentials', "支持跨域传cookie")
    .option('-t, --tags <tagName>', "按tag分组生成文件,(@)生成全部tag的, (@aaa@bbb)生成aaa和bbb的")
    .option('-p, --promise', "注入Promise依赖,默认不注入")
    .version(appInfo.version)
    .action(execute(codegen.create));

app
    .command('util <toPath> [outFileName]')
    .description('创建一个api调用工具\n' +
        '  必填:<输出文件位置> [输出文件名称,默认ApiUtil]')
    .option('-a, --ajax <type>', "发送请求类型, a: axios类型, 目前只支持axios类型")
    .option('-s, --surround <mode>', "包围模式, 将生成的代码包含在UMD-1 AMD-2 CommonJS-3 闭包-4 ES6-5 中")
    .version(appInfo.version)
    .action(execute(apiUtil.create));

app
    .command('mock <swaggerFile>')
    .description('生成含有mock数据的swagger文件 必填:<swagger文件位置,本地或线上yaml或JSON格式文件> <输出JSON文件位置及名称>')
    .option('-f, --file <filePath>', "生成mock file")
    .option('-s, --server [portNum]', "启动mock server,端口号,默认8000")
    .option('-c, --config <filePath>', "mock数据配置文件")
    .option('-l, --lite', "不自动识别config文件")
    .action(execute(mock.create));

app.parse(process.argv);
cli.validate(app);