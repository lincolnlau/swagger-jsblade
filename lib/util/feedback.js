'use strict';

var EventEmitter = require('events').EventEmitter;
var feedback = new EventEmitter();
var CHANNEL = 'feedback';
var util = require('util');
var _ = require('lodash');

module.exports = {

  on: function(cb) {
    feedback.on(CHANNEL, function(feedback) {
      cb(feedback);
    });
  },

  emit: function(string) {
    if (Buffer.isBuffer(string)) { string = string.toString(); }
    if (arguments.length > 1 && _.isString(string)) {
      string = util.format.apply(this, arguments);
    }
    feedback.emit(CHANNEL, string);
  }
};