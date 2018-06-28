const bus = require("fruster-bus");

class Publishes {

    static get subjects() {

        return {
            USER_DELETED: "pub.user-service.user-deleted"
        };

    }

    /**
     * Publish user deleted event
     * 
     * @param {String} reqId 
     * @param {String} userId 
     */
    static async userDeleted(reqId, userId) {
        bus.publish(Publishes.subjects.USER_DELETED, {
            reqId,
            data: {
                userId
            }
        });
    }

}

module.exports = Publishes;