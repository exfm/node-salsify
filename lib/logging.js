"use strict";

var winston = require('winston'),
    old = winston.Logger.prototype.log,
    defaultLevel = 'crit';

winston.Logger.prototype.log = function(level, msg){
    if(this.name){
        return old.apply(this, [level, "\x1B[90m["+this.name + "]\x1B[39m: " + msg]);
    }
    return old.apply(this, [level, msg]);
};


module.exports = function (name){
    var log = winston.loggers.add(name,
        {'console': {'level': module.exports.defaultLevel, 'colorize': 'true'}});
    log.name = name;
    module.exports.loggers[name] = log;
    return log;
};

module.exports.defaultLevel = defaultLevel;
module.exports.loggers = {};