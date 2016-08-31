var utils = require('./utils/utils');
var database;

module.exports = createInitialUser;

function createInitialUser(db) {
  
  return db.collection("initialUser").find().then(users => {
    if(!users.length) {
      // TODO create
    }
}
