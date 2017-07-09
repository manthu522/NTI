var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('./utility/logger');
var config = require('./config');
var expressValidator = require('express-validator');
var cors = require('cors');
var io = require('socket.io');
var _ = require('lodash');
var moment = require('moment');

var app = express();

logger.info("App starting.");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressValidator);
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // automatically supports pre-flighting

// Add routes
require('./routes')(app);

// error handlers
app.disable('x-powered-by');

//Invalid request URI or Invalid Method
app.get('/*', function(req, res, next) {
	res.json([ {
		status : "error",
		message : 'Invalid API request!'
	} ]);
});

app.use(function(err, req, res, next) {

			if (err instanceof Error) {
				res.send({
					status : "error",
					message : err.message
				});
			} else {
				res.send({
					status : err.status,
					message : err.message,
					errors : err.errors
				});
			}

});
let trainSchedules = [];
var listen = app.listen(config.port);
logger.info("Application is running: " + config.url);

//open a listener for socket.io, so that server will listen for any websocket connections that may occur.
var socket = io.listen(listen);
socket.on('connection', function(socket){
	console.log("Client Connected");
});

function runIt(startTime, endTime) {
  var currentTime = moment(new Date(), "HH:mm a");

  var startTime = moment(startTime, "HH:mm a");
  var endTime = moment(endTime, "HH:mm a");

 if ( (startTime.hour() >=12 && endTime.hour() <=12 ) || endTime.isBefore(startTime) ){
		endTime.add(1, "days");       // handle spanning days endTime

		if (currentTime.hour() <=12 ){
			currentTime.add(1, "days");       // handle spanning days currentTime
		}
	}

  var isBetween = currentTime.isBetween(startTime, endTime);
  console.log(isBetween)

}

//Central Station repeats every 20 mints
setInterval(function(){
	_.remove(trainSchedules, function(schedule) {
			return schedule.id === 1;
	});
	trainSchedules.push({id: 1, destination: 'Central Station', dTime: moment().format('YYYY-MM-DD HH:mm:ss') });

}, 1200000);//1200000

//Circular repeats every 1 hour
setInterval(function(){
	_.remove(trainSchedules, function(schedule) {
			return schedule.id === 2;
	});
	trainSchedules.push({id: 2, destination: 'Circular', dTime: moment().format('YYYY-MM-DD HH:mm:ss') });

}, 3600000);//3600000



//North Square repats every 12 minutes
setInterval(function(){
	_.remove(trainSchedules, function(schedule) {
			return schedule.id === 3;
	});

	var currentTime = moment(new Date());

  var startTime = moment('07:00 am', "HH:mm a");
  var endTime = moment('10:00 pm', "HH:mm a");

	if(currentTime.isBetween(startTime, endTime)){
		trainSchedules.push({id: 3, destination: 'North Square', dTime: moment().format('YYYY-MM-DD HH:mm:ss') });
	}

}, 720000);//720000

//West Market repeats every 6 minutes
setInterval(function(){
	_.remove(trainSchedules, function(schedule) {
			return schedule.id === 4;
	});
	var currentTime = moment(new Date());

  var startTime = moment('05:30 am', "HH:mm a");
  var endTime = moment('01:30 am', "HH:mm a");

	if ( (startTime.hour() >=12 && endTime.hour() <=12 ) || endTime.isBefore(startTime) ){
        endTime.add(1, "days");       // handle spanning days endTime

        if (currentTime.hour() <=12 )
        {
            currentTime.add(1, "days");       // handle spanning days currentTime
        }
    }

	if(currentTime.isBetween(startTime, endTime)){
		trainSchedules.push({id: 4, destination: 'West Market', dTime: moment().format('YYYY-MM-DD HH:mm:ss') });
	}

}, 360000);//360000

//push data every second to the clients, so that without browser loading data will
// refreshed automatically
setInterval(function(){
		let format = "HH:mm:ss";
		var currentTime =  moment(new Date());

		let test = _.map(trainSchedules, function(o){
				var minutes = currentTime.diff(moment(o.dTime), 'minutes');
				if(o.id === 1){
						o['arriaval'] = 20 - Math.round(minutes);
				}else if(o.id === 2){
						o['arriaval'] = 60 - Math.round(minutes);
				}else if(o.id === 3){
						o['arriaval'] = 12 - Math.round(minutes);
				}else if(o.id === 4){
						o['arriaval'] = 6 - Math.round(minutes);
				}
				return trainSchedules;
		});

		trainSchedules = _.sortBy(trainSchedules, function(o) { return o.arriaval; });

		//At 5 of every day reset all the train timings :)
		if(currentTime === '5:00:00'){
			trainSchedules = [];
		}

		//sending notification to the client
		socket.emit('test', { message: trainSchedules, currentTime: moment().format('HH:mm:ss') });

}, 1000);

module.exports = app;
