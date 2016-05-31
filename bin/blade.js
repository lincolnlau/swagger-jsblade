#!/usr/bin/env node

'use strict';

var app =  require('commander');
var project = require('../lib/commands/project');
var frameworks = Object.keys(project.frameworks).join('|');
var cli = require('../lib/util/cli');
var execute = cli.execute;

app
  .command('create [name]')
  .description('创建一个文件夹包含一个前端项目')
  .option('-f, --framework <framework>', frameworks + " 中的一个" )
  .action(execute(project.create));


app.parse(process.argv);
cli.validate(app);