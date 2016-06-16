#!/usr/bin/env node

'use strict';

var app =  require('commander');
var project = require('../lib/commands/project');
var codegen = require('../lib/commands/codegen');
var mock = require('../lib/commands/mock');
var frameworks = Object.keys(project.frameworks).join('|');
var cli = require('../lib/util/cli');
var execute = cli.execute;

app
  .command('create [name]')
  .description('创建一个文件夹包含一个前端项目')
  .option('-f, --framework <framework>', frameworks + " 中的一个" )
  .action(execute(project.create));

app
    .command('api')
    .description('创建一个api接口集合')
    .option('-n, --ngHttp', "$http类型")
    .option('-r, --resource', "angular-resource类型")
    .option('<apiName> <swaggerFile> <toPath>', "angular-resource类型")
    .action(execute(codegen.create));

app
.command('mock [name]')
.description('创建一个API Mock server')
.option('<swaggerFile>', "angular-resource类型")
.action(execute(mock.create));

app.parse(process.argv);
cli.validate(app);