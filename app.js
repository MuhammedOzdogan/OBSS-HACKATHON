var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio;

var sync = require('synchronize');


var order = require('./motorOrder/motorOrder');

var pipeLocaiton = 0;
var tour = 0;

var firstMotorTimeOut;
var secondMotorTimeOut;
var stepPins = [4, 17, 23, 24];
var stepPinsSecondMotor = [16, 19, 20, 26];

var pinNumber = stepPins.length;
var pins = [];
var pins2 = [];
var stepCounter = 0;
var stepCounter2 = 0;
var timeout = 0.01;
var stepCount = 8;

Seq = [];
Seq[0] = [1, 0, 0, 0];
Seq[1] = [1, 1, 0, 0];
Seq[2] = [0, 1, 0, 0];
Seq[3] = [0, 1, 1, 0];
Seq[4] = [0, 0, 1, 0];
Seq[5] = [0, 0, 1, 1];
Seq[6] = [0, 0, 0, 1];
Seq[7] = [1, 0, 0, 1];

BackwardSeq = (Seq.slice()).reverse();

for (var i = 0; i < pinNumber; i++) {
    pins[i] = new Gpio(stepPins[i], 'out');
    pins2[i] = new Gpio(stepPinsSecondMotor[i], 'out');
}


var step = function () {
    pipeLocaiton++;

    for (var pin = 0; pin < 4; pin++) {
        if (Seq[stepCounter][pin] != 0) {
            pins[pin].writeSync(1);
        } else {
            pins[pin].writeSync(0);
        }
    }
    stepCounter += 1
    if (stepCounter == stepCount) {
        stepCounter = 0;
    }
    if (stepCounter < 0) {
        stepCounter = stepCount;
    }


    firstMotorTimeOut = setTimeout(function () {
        step()
    }, timeout);
};

var step2 = function () {

    for (var pin = 0; pin < 4; pin++) {
        if (Seq[stepCounter2][pin] != 0) {
            pins2[pin].writeSync(1);
        } else {
            pins2[pin].writeSync(0);
        }
    }
    stepCounter2 += 1
    if (stepCounter2 == stepCount) {
        stepCounter2 = 0;
    }
    if (stepCounter2 < 0) {
        stepCounter2 = stepCount;
    }

    secondMotorTimeOut = setTimeout(function () {
        step2()
    }, timeout);
};

var stepBackward = function () {

    pipeLocaiton--;

    for (var pin = 0; pin < 4; pin++) {
        if (BackwardSeq[stepCounter][pin] != 0) {
            pins[pin].writeSync(1);
        } else {
            pins[pin].writeSync(0);
        }
    }
    stepCounter += 1
    if (stepCounter == stepCount) {
        stepCounter = 0;
    }
    if (stepCounter < 0) {
        stepCounter = stepCount;
    }

    firstMotorTimeOut = setTimeout(function () {
        stepBackward()
    }, timeout);
};

var stepBackward2 = function () {

    for (var pin = 0; pin < 4; pin++) {
        if (BackwardSeq[stepCounter2][pin] != 0) {
            pins2[pin].writeSync(1);
        } else {
            pins2[pin].writeSync(0);
        }
    }
    stepCounter2 += 1
    if (stepCounter2 == stepCount) {
        stepCounter2 = 0;
    }
    if (stepCounter2 < 0) {
        stepCounter2 = stepCount;
    }

    secondMotorTimeOut = setTimeout(function () {
        stepBackward2()
    }, timeout);
};


function clearTimeInterval() {
    clearTimeout(firstMotorTimeOut);
    clearTimeout(secondMotorTimeOut);
    console.log("Location of pipe : " + pipeLocaiton);
    return true;
}

function goForward() {
    step();
    step2();
}

function goBackward() {
    stepBackward();
    stepBackward2();
}

function unexportOnClose() { //function to run when exiting program
    for (var i = 0; i < pinNumber; i++) {
        pins[i].writeSync(0);
        pins[i].unexport();
        pins2[i].writeSync(0);
        pins2[i].unexport();
    }
    console.log("Last location of pipe is: " + pipeLocaiton);
    process.exit();
};

function goForwardOrder(destination) {

    if (pipeLocaiton <= destination) {
        return forwardToTarget1(destination) ||
            forwardToTarget2(destination);
    }
}

function backForwardOrder(destination) {

    if (pipeLocaiton >= destination) {
        return backForwardToTarget1(destination) ||
            backForwardToTarget2(destination);
    }
}

function backForwardToTarget1(destination) {
    pipeLocaiton--;

    for (var pin = 0; pin < 4; pin++) {
        if (BackwardSeq[stepCounter][pin] != 0) {
            pins[pin].writeSync(1);
        } else {
            pins[pin].writeSync(0);
        }
    }
    stepCounter += 1
    if (stepCounter == stepCount) {
        stepCounter = 0;
    }
    if (stepCounter < 0) {
        stepCounter = stepCount;
    }

    if (+pipeLocaiton === +destination) {
        const result = clearTimeInterval();
        goForwardOrder(order.end);
        return result;
    }
    else {
        firstMotorTimeOut = setTimeout(function () {
            backForwardToTarget1(destination)
        }, timeout);
    }
}

function backForwardToTarget2(destination) {

    for (var pin = 0; pin < 4; pin++) {
        if (BackwardSeq[stepCounter2][pin] != 0) {
            pins2[pin].writeSync(1);
        } else {
            pins2[pin].writeSync(0);
        }
    }
    stepCounter2 += 1
    if (stepCounter2 == stepCount) {
        stepCounter2 = 0;
    }
    if (stepCounter2 < 0) {
        stepCounter2 = stepCount;
    }

    if (+pipeLocaiton === +destination) {
        const result = clearTimeInterval();
        goForwardOrder(order.end);
        return result;
    }
    else {
        firstMotorTimeOut = setTimeout(function () {
            backForwardToTarget2(destination)
        }, timeout);
    }
}

function forwardToTarget1(destination) {

    pipeLocaiton++;

    for (var pin = 0; pin < 4; pin++) {
        if (Seq[stepCounter][pin] != 0) {
            pins[pin].writeSync(1);
        } else {
            pins[pin].writeSync(0);
        }
    }
    stepCounter += 1
    if (stepCounter == stepCount) {
        stepCounter = 0;
    }
    if (stepCounter < 0) {
        stepCounter = stepCount;
    }

    if (+pipeLocaiton === +destination) {
        const result = clearTimeInterval();
        tour++;
        console.log("Tour: " + tour);
        if (tour > order.tour) {
            tour = 0;
            return true;
        }
        backForwardOrder(order.start);
        return result;
    }
    else {
        firstMotorTimeOut = setTimeout(function () {
            forwardToTarget1(destination)
        }, timeout);
    }
}

function forwardToTarget2(destination) {

    for (var pin = 0; pin < 4; pin++) {
        if (Seq[stepCounter2][pin] != 0) {
            pins2[pin].writeSync(1);
        } else {
            pins2[pin].writeSync(0);
        }
    }
    stepCounter2 += 1
    if (stepCounter2 == stepCount) {
        stepCounter2 = 0;
    }
    if (stepCounter2 < 0) {
        stepCounter2 = stepCount;
    }

    if (+pipeLocaiton === +destination) {
        const result = clearTimeInterval();
        backForwardOrder(order.start);
        return result;
    }
    else {
        secondMotorTimeOut = setTimeout(function () {
            forwardToTarget2(destination)
        }, timeout);
    }
}

function goTo(destination) {

    console.log("In goTo pipeLocaiton: " + pipeLocaiton);
    console.log("In goTo destination: " + destination);
    if (pipeLocaiton < destination) {
        return goForwardOrder(destination);
    }

    if (pipeLocaiton > destination) {
        return backForwardOrder(destination);
    }
    else if(pipeLocaiton === destination) {
        console.log("Tek motorun dondugu durum basladi");
        return backForwardOrder(order.start);
    }
    clearTimeInterval();
    return false;

}

process.on('SIGINT', unexportOnClose);

//HTTP SERVER

http.listen(8080); //listen to port 8080

function handler(req, res) { //create server
    fs.readFile(__dirname + '/public/index.html', function (err, data) { //read file index.html in public folder
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
            return res.end("404 Not Found");
        }
        res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
        res.write(data); //write data from index.html
        return res.end();
    });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
    var lightvalue = 0; //static variable for current status
    var backwardValue = 0;


    socket.on('forward', function (data) { //get light switch status from client
        lightvalue = data;
        console.log("Scoket forward data:" + data);
        if (lightvalue === 0) { //only change LED if status has changed
            clearTimeInterval();
        } else {
            goForward();
        }
    });

    socket.on('backward', function (data) {
        console.log("Backward pushed and data: " + data);
        backwardValue = data;
        if (backwardValue == 0) {
            clearTimeInterval();
        } else {
            goBackward();
        }
    });

    socket.on('order', function (data) {
            order = JSON.parse(data);
            console.log("Order recived from mobile client and data: " + data);
            // backForwardOrder(order.start, sync.defer());
            tour = 0;
            clearTimeInterval();
            goTo(order.end);


        }
    );
});
