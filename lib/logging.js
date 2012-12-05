"use strict";

var winston = require('winston'),
    old = winston.Logger.prototype.log;

winston.Logger.prototype.log = function(level, msg){
    if(this.name){
        return old.apply(this, [level, "\x1B[90m["+this.name + "]\x1B[39m: " + msg]);
    }
    return old.apply(this, [level, msg]);
};

module.exports = function (name){
    var log = winston.loggers.add(name,
        {'console': {'level': 'silly', 'colorize': 'true'}});
    log.name = name;
    return log;
};