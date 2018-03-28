const PasswordManager = require("../lib/managers/PasswordManager");
const config = require("../config");
const log = require("fruster-log");


describe("PasswordManager", () => {

    let hashingAlgoritmDefaultValue;

    beforeAll(() => {
        hashingAlgoritmDefaultValue = config.hashingAlgorithm;
    });

    afterEach(() => {
        config.hashingAlgorithm = hashingAlgoritmDefaultValue;
    });

    it("should be able to hash password using sha512 and validate the password", async done => {
        try {
            const password = " hello";
            const id = "user-id";
            const passwordManager = new PasswordManager(null);
            const salt = passwordManager._generateSalt();
            const hashDate = new Date();
            const pepper = passwordManager._generatePepper(id, password, hashDate);
            const hashResponse = await passwordManager._hashPassword(password, salt, pepper);

            expect(hashResponse.length).toBe(128);
            expect(await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(true, "await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should be able to hash password using pbkdf2 and validate the password", async done => {
        try {
            config.hashingAlgorithm = "pbkdf2";

            const password = " hello";
            const id = "user-id";
            const passwordManager = new PasswordManager(null);
            const salt = passwordManager._generateSalt();
            const hashDate = new Date();
            const pepper = passwordManager._generatePepper(id, password, hashDate);
            const hashResponse = await passwordManager._hashPassword(password, salt, pepper);

            expect(hashResponse.length).toBe(128);
            expect(await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(true, "await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should not be able to login with sha512 password if config is set to pbkdf2", async done => {
        try {
            config.hashingAlgorithm = "sha512";

            const password = " hello";
            const id = "user-id";
            const passwordManager = new PasswordManager(null);
            const salt = passwordManager._generateSalt();
            const hashDate = new Date();
            const pepper = passwordManager._generatePepper(id, password, hashDate);
            const hashResponse = await passwordManager._hashPassword(password, salt, pepper);

            config.hashingAlgorithm = "pbkdf2";

            expect(await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(false, "await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should not be able to login with pbkdf2 password if config is set to sha512", async done => {
        try {
            config.hashingAlgorithm = "pbkdf2";

            const password = " hello";
            const id = "user-id";
            const passwordManager = new PasswordManager(null);
            const salt = passwordManager._generateSalt();
            const hashDate = new Date();
            const pepper = passwordManager._generatePepper(id, password, hashDate);
            const hashResponse = await passwordManager._hashPassword(password, salt, pepper);

            config.hashingAlgorithm = "sha512";

            expect(await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(false, "await passwordManager.validatePassword(hashResponse, salt, id, password, hashDate)");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

});