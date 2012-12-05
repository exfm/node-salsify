"use strict";

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    backends = require('./lib/backends'),
    createLog = require('./lib/logging');

function Salsify(){
    this.ready = false;
    this.backend = new backends.sqs();
    this.key = undefined;
    this.secret = undefined;
    this.log = createLog('salsify');
}
util.inherits(Salsify, EventEmitter);

Salsify.prototype.use = function(backend){
    this.log.silly("Switching to backend `"+backend+"`");
    this.backend = new backends[backend]();
    return this;
};

Salsify.prototype.configure = function(cb){
    var isSync = cb.length === 0,
        self = this;

    function done(){
        self.log.silly('Going to configure backend...');
        self.backend.configure(self, function(){
            self.log.silly('Backend configured.  Sending ready.');
            self.ready = true;
            self.emit('ready');
        });
    }
    if(isSync){
        cb.apply(this, []);
        done();
    }
    else{
        cb.apply(this, [done]);
    }
    return this;
};

Salsify.prototype.delay = function(queue, data){
    this.log.silly('Enqueuing message on `' + queue + '`: ' + util.inspect(data, true, 5, false));
    if(!this.ready){
        this.on('ready', this.delay(queue, data).bind(this));
    }
    else{
        this.backend.put(queue, data);
    }
    return this;
};

var salsify = module.exports = new Salsify();
module.exports.Salsify = Salsify;


function Worker(parent){
    this.message = undefined;
    this.salsify = parent || salsify;
    this.log = createLog('salsify.worker');
}
util.inherits(Worker, EventEmitter);

Worker.prototype.configure = function(cb){
    cb.apply(this, []);
};

Worker.prototype.startListening = function(queue){
    var self = this;
    self.log.silly('Telling backend `' + self.salsify.backend.type + '` to listen on queue ' + queue);
    this.salsify.backend.listen(queue, function(){
        self.log.silly('Backend listening.  Adding job event listener.');
        self.salsify.backend.on('job', function(data, cb){
            self.log.silly('Got job from backend.  Bubbling up. ' + util.inspect(data, true, 5, false));
            try{
                self.emit('job', data, function(err, result){
                    cb(err, result);
                    if(err){
                        self.log.error('Job emitted error: ' + err.message);
                        self.emit('error', err);
                    }
                    else{
                        self.log.silly('Completed successfully.  Result: ' + util.inspect(result, true, 5, false));
                        self.emit('success', result);
                    }
                });
            }
            catch(e){
                self.log.error('Error while trying to process job: ' + e.message);
                self.log.error(e.stack);
                self.emit('error', e);
                cb(e, undefined);
            }
        });
    });
    return this;
};

Worker.prototype.listen = function(queue){
    var self = this;
    self.log.debug('Listen called for Queue ' + queue);
    if(this.salsify.ready){
        self.log.silly('Salsify ready. Calling startListening now.');
        self.startListening(queue);
    }
    else{
        self.log.silly('Salsify NOT ready. Adding event listener.');
        this.salsify.on('ready', function(){
            self.startListening(queue);
        });
    }

    return self;
};

Worker.prototype.close = function(){
    this.backend.close();
};

module.exports.Worker = Worker;

module.exports.setLogLevel = function(level){
    Object.keys(createLog.loggers).forEach(function(name){
        createLog.loggers[name].transports.console.level = level;
    });
};
module.exports.getLoggers = function(){
    return createLog.loggers;
};