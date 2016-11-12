var conf = require("./config");
var userService = require("./fruster-user-service");

require("fruster-health").start();

userService.start(conf.bus, conf.mongoUrl);