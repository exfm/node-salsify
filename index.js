"use strict";

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    backends = require('./lib/backends');

function Salsify(){
    this.ready = false;

    this.backend = new backends.sqs();

    this.key = undefined;
    this.secret = undefined;
}
util.inherits(Salsify, EventEmitter);

Salsify.prototype.use = function(backend){
    this.backend = new backends[backend]();
    return this;
};

Salsify.prototype.configure = function(cb){
    var isSync = cb.length === 0,
        self = this;

    function done(){
        self.backend.configure(self, function(){
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
}
util.inherits(Worker, EventEmitter);

Worker.prototype.startListening = function(queue){
    var self = this;
    this.salsify.backend.listen(queue, function(){
        self.salsify.backend.on('job', function(data, cb){
            try{
                self.emit('job', data, function(err, result){
                    cb(err, result);
                    if(err){
                        self.emit('error', err);
                    }
                    else{
                        self.emit('success', result);
                    }
                });
            }
            catch(e){
                self.emit('error', e);
            }
        });
    });
    return this;
};

Worker.prototype.listen = function(queue){
    var self = this;
    if(this.salsify.ready){
        self.startListening(queue);
    }
    else{
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