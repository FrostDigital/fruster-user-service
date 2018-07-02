const FrusterRequest = require("fruster-bus").FrusterRequest;
const ProfileRepo = require("../repos/ProfileRepo");
const UserManager = require("../managers/UserManager");
const ProfileManager = require("../managers/ProfileManager");


class UpdateProfileHandler {

    /**
     * 
     * @param {ProfileRepo} profileRepo 
     * @param {UserManager} userManager 
     * @param {ProfileManager} profileManager 
     */
    constructor(profileRepo, userManager, profileManager) {
        this._profileRepo = profileRepo;
        this._userManager = userManager;
        this._profileManager = profileManager;
    }

    /**
     * @param {FrusterRequest} req
     */
    async handle(req) {
        const id = req.data.id;

        let updateProfileData = req.data;

        /** Splits update data into user / profile and only updates fields configured to be part of the profile dataset */
        let [, profile] = await this._profileManager.splitUserFields(updateProfileData);

        profile = this._userManager.validateUpdateData(profile);

        const updatedProfile = await this._profileManager.updateProfile(id, profile);

        return {
            status: 200,
            data: updatedProfile
        };
    }

}

module.exports = UpdateProfileHandler;