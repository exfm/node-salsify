# node-salsify

Like celery for node.js.

Uses AWS Simple Queue Service or an in memory queue for moving messages around.
More backends will be added as needed.

## Todo

 - Support storing results somehow.

 ## Usage

 Have a look at `./examples` ot `./test/salsify.test.js`, but basically:


    // Here is a simple worker bin.
    var salsify = require('salsify').configure(function(done){
        salsify.key = 'myAwsKey';
        salsify.secret = 'myAwsSecret';
        done();
    }).use('sqs');

    new salsify.Worker()
        .on('job', function(data, done){
            console.log('Got a job', data);
            done(null, true);
        })
        .listen('myqueue');

    // Then in your app, you can push messages to it.
    var salsify = require('salsify').configure(function(done){
        salsify.key = 'myAwsKey';
        salsify.secret = 'myAwsSecret';
        done();
    }).use('sqs');

    // ... Some app code and stuff ...
    function doSomethingLater(){
        salsify.delay('myqueue', {'a': 'Any object you want'});
    }


## Install

     npm install salsify

## Testing

    git clone
    npm install
    npm test
