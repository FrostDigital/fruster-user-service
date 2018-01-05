const utils = require('./utils/utils');
const uuid = require('uuid');
const log = require('fruster-log');
const conf = require('../config');
const CreateUserHandler = require("./handlers/CreateUserHandler");
const Db = require("mongodb").Db;

/**
 * @param {Db} db 
 * @param {CreateUserHandler} createUserHandler 
 */
module.exports = function (db, createUserHandler) {

    const userCollection = db.collection(conf.userCollection);
    const initialUserCollection = db.collection("initial-user");

    function checkIfInitialUserExists() {
        return userCollection.findOne({
            email: conf.initialUserEmail
        })
            .then(user => {
                if (!user)
                    return initialUserCollection.findOne({}).then(u => !!u);

                return true;
            });
    }

    function createInitialUser() {
        log.debug("Creating initial user", conf.initialUserEmail);

        const user = {
            email: conf.initialUserEmail,
            password: conf.initialUserPassword,
            firstName: "Admin",
            lastName: "Nimda",
            roles: [conf.initialUserRole]
        };
        // @ts-ignore
        return createUserHandler.handle({
            reqId: uuid.v4(),
            data: user
        })
            .then(() => initialUserCollection.insert({
                _id: uuid.v4(),
                email: user.email
            }));
    }

    return checkIfInitialUserExists()
        .then(exists => exists ? Promise.resolve() : createInitialUser());
};