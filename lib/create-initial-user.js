var utils = require('./utils/utils');
var uuid = require('uuid');
var conf = require('../config');
var createUser = require('./create-user');

module.exports = function(db) {
  
  const userCollection = db.collection(conf.userCollection);
  const initialUserCollection = db.collection("initial-user");

  function checkIfInitialUserExists() {    
    return userCollection.findOne({email: conf.initialUserEmail}).then(user => {
      if(!user) {
        return initialUserCollection.findOne().then(u => !!u);
      }
      return true;
    });
  }

  function createInitialUser() {
    createUser.init(userCollection);
    
    console.log("Creating initial user", conf.initialUserEmail);

    var user = {
      email: conf.initialUserEmail,
      password: conf.initialUserPassword,
      firstName: "Admin",
      lastName: "Nimda",
      roles: ["super-admin"]
    };

    return createUser.handle({ data: user })
      .then(() => initialUserCollection.insert({ _id: uuid.v4(), email: user.email }));
  }

  return checkIfInitialUserExists()
    .then(exists => exists ? Promise.resolve() : createInitialUser());
};






