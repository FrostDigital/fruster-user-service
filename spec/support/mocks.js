const uuid = require("uuid");
const bus = require("fruster-bus");

module.exports = {

    getUserObject: () => {
        return {
            "roles": ["ADMIN"],
            "firstName": "Viktor",
            "middleName": "Ludvig",
            "lastName": "Söderström",
            "email": uuid.v4() + "@frostdigxital.se",
            "password": "Localhost:8080"
        };
    },

    getOldUserObject: () => {
        return {
            "email": "admin@frost.se",
            "password": "4ac754da841d466229c0e4d6e449b2177ab9efdf2c640c55217abc8dd447290746148b1c275dfb4a4c4ecceaf812cb6feb8c6fa5372dd55f56994a93cdcc9c26",
            "firstName": "admin",
            "lastName": "nimda",
            "roles": [
                "super-admin"
            ],
            "middleName": null,
            "id": "58b6fd6a-f651-4e8a-8297-acf5c0494a58",
            "salt": "nd0h6fbp0e65sdrsp0lg0izpajko403wou479oef0xvyq5jaif"
        };
    },

    getUserWithUnvalidatedEmailObject: () => {
        return {
            "roles": ["ADMIN"],
            "firstName": "Pedro",
            "middleName": "Von",
            "lastName": "Damn",
            "email": uuid.v4() + "@frostdigxitalx.se",
            "password": "Localhost:8080",
            "emailValidated": false,
            "emailValidationToken": "hello-token"
        };
    },

    createUser: async (userObj) => {
        return await bus.request("user-service.create-user", { reqId: uuid.v4(), data: userObj });
    },

    mockMailService: () => {
        bus.subscribe("mail-service.send", (req) => {
            return { reqId: req.reqId, status: 200 }
        });
    }

}