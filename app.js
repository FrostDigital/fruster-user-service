var conf = require('./config');
var userService = require('./fruster-user-service');

userService.start(conf.bus, conf.mongoUrl);