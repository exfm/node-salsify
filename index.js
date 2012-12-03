"use strict";

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    aws = require('plata');

function Salsify(){
    this.ready = false;

    this.key = undefined;
    this.secret = undefined;
    this.queues = {};
}
util.inherits(Salsify, EventEmitter);

Salsify.prototype.configure = function(cb){
    var self = this;
    cb.apply(this, [function(){
        aws.connect({'key': self.key, 'secret': self.secret});
        aws.onConnected(function(){
            self.ready = true;
            self.emit('ready');
        });
    }]);
    return this;
};

Salsify.prototype.getQueue = function(queue){
    if(!this.queues.hasOwnProperty(queue)){
        this.queues[queue] = aws.sqs.Queue(queue);
    }
    return this.queues[queue];
};

Salsify.prototype.delay = function(queue, data){
    if(!this.queues.hasOwnProperty(queue)){
        this.queues[queue] = aws.sqs.Queue(queue);
    }
    this.queues[queue].put(data);
    return this;
};

var salsify = module.exports = new Salsify();

function Worker(){
    this.queue = undefined;
    this.listening = false;
    this.message = undefined;
}
util.inherits(Worker, EventEmitter);

Worker.prototype.startListening = function(queue){
    var self = this;
    this.queue = salsify.getQueue(queue);

    this.queue.on('message', function(message){
        self.message = message;
        self.queue.close();
        self.listening = false;

        self.emit('job', message.body, function(err, result){
            self.handleJobResult(err, result);
            self.queue.listen(100);
            self.listening = true;
        });
    });
};

Worker.prototype.handleJobResult = function(err, result){
    if(err){
        this.emit('error', err, this.message);
        this.message.rettry();
    }
    else{
        this.message.ack();
        this.emit('success', result, this.message);
    }
};

Worker.prototype.listen = function(queue){
    var self = this;
    if(salsify.ready){
        self.startListening(queue);
    }
    else{
        salsify.on('ready', function(){
            self.startListening(queue);
        });
    }
    return self;
};

Worker.prototype.close = function(){
    this.queue.close();
    this.listening = false;
};

module.exports.Worker = Worker;