"use strict";
var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    aws = require('plata'),
    uuid = require('node-uuid'),
    plog = require('plog');

function SQS(){
    this.queues = {};
    this.message = undefined;
    this.listening = false;
    this.log = plog('salsify.backend.sqs');
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
    var self = this;

    this.log.silly('Connecting to AWS...');
    aws.connect({'key': parent.key, 'secret': parent.secret});
    aws.onConnected(function(){
        self.log.silly('Connected to AWS');
        cb();
    });
};

SQS.prototype.put = function(queue, message){
    this.getQueue(queue).put(message);
};

SQS.prototype.listen = function(q, cb){
    var self = this,
        queue = self.getQueue(q);

    this.log.silly('Adding message listener on queue `'+q+'`');
    queue.on('message', function(message){
        self.log.silly('Got message.');
        self.message = message;
        self.log.silly('Closing incomings.');
        queue.close();

        self.log.silly('Bubbling up message.');
        self.emit('job', message.body, function(err, result){
            if(err){
                self.log.silly('Error from worker.  Adding back to retry.');
                self.message.retry();
            }
            else{
                self.log.silly('Success from worker.  ACK\'ing.');
                self.message.ack();
            }
            self.log.silly('Ready to re-open for business.  Calling SQS.Queue.listen...');
            queue.listen(1000, function(){
                self.log.silly('SQS poll interval running');
            });
        });
    });
    self.log.silly('Calling SQS.Queue.listen...');
    queue.listen(1000, function(){
        self.log.silly('SQS poll interval running');
        cb();
    });
};

function Memory(){
    this.queues = {};
    this.log = plog('salsify.backend.memory');
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
    this.log.silly('Adding listener `put:'+queue+'`');
    this.on('put:'+queue, function(id, message){
        this.log.silly('Got job on `'+queue+'`.  Bubbling up.');
        self.emit('job', message, function(err, result){
            if(!err){
                // self.emit('put:' + queue, id, message);
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