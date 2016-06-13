#!/usr/bin/env node

'use strict';

var app =  require('commander');
var project = require('../lib/commands/project');
var codegen = require('../lib/commands/codegen');
var frameworks = Object.keys(project.frameworks).join('|');
var cli = require('../lib/util/cli');
var execute = cli.execute;

app
  .command('create [name]')
  .description('创建一个文件夹包含一个前端项目')
  .option('-f, --framework <framework>', frameworks + " 中的一个" )
  .action(execute(project.create));

app
    .command('api <names> <swaggerFile> <toPath>')
    .description('创建一个api接口集合')
    //.option('-n, --ngHttp', "$http类型")
    //.option('-r, --resource', "angular-resource类型")
    //.option('<name> <swaggerFile> <toPath>', "ss")
    .action(execute(codegen.create));

app.parse(process.argv);
cli.validate(app);