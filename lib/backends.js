"use strict";
var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    aws = require('plata'),
    uuid = require('node-uuid');

function SQS(){
    this.queues = {};
    this.message = undefined;
    this.listening = false;
}
util.inherits(SQS, EventEmitter);
SQS.prototype.type = "sqs";
SQS.prototype.getQueue = function(queue){
    if(!this.queues.hasOwnProperty(queue)){
        this.queues[queue] = aws.sqs.Queue(queue);
    }
    return this.queues[queue];
};

SQS.prototype.configure = function(parent, cb){
    aws.connect({'key': parent.key, 'secret': parent.secret});
    aws.onConnected(function(){
        cb();
    });
};

SQS.prototype.put = function(queue, message){
    this.getQueue(queue).put(message);
};

SQS.prototype.listen = function(queue, cb){
    var self = this;
    this.queue = self.getQueue(queue);

    this.queue.on('message', function(message){
        self.message = message;
        self.queue.close();
        self.listening = false;

        self.emit('job', message.body, function(err, result){
            if(err){
                this.message.retry();
            }
            else{
                this.message.ack();
            }
            self.queue.listen(100);
            self.listening = true;
        });
    });
    cb();
};

function Memory(){
    this.queues = {};
}
util.inherits(Memory, EventEmitter);
Memory.prototype.type = "memory";
Memory.prototype.configure = function(parent, cb){
    cb();
};

Memory.prototype.getQueue = function(queue){
    if(!this.queues.hasOwnProperty(queue)){
        this.queues[queue] = {};
    }
    return this.queues[queue];
};

Memory.prototype.put = function(queue, message){
    var id = uuid.v4();
    this.getQueue(queue)[id] = message;
    this.emit('put:' + queue, id, message);
};

Memory.prototype.listen = function(queue, cb){
    var self = this;
    this.on('put:'+queue, function(id, message){
        self.emit('job', message, function(err, result){
            if(err){
                this.emit('put:' + queue, id, message);
            }
            else{
                delete self.getQueue(queue)[id];
            }
        });
    });
    cb();
};


module.exports = {
    "memory": Memory,
    "sqs": SQS
};