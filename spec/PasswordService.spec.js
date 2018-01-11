const PasswordService = require("../lib/services/PasswordService");
const config = require("../config");


describe("PasswordService", () => {

    let hashingAlgoritmDefaultValue;

    beforeAll(() => {
        hashingAlgoritmDefaultValue = config.hashingAlgorithm;
    });

    afterEach(() => {
        config.hashingAlgorithm = hashingAlgoritmDefaultValue;
    });

    it("should be able to hash password using sha512 and validate the password", async done => {
        const password = " hello";
        const id = "user-id";
        const passwordService = new PasswordService();
        const salt = passwordService._generateSalt();
        const hashDate = new Date();
        const pepper = passwordService._generatePepper(id, password, hashDate);
        const hashResponse = await passwordService._hashPassword(password, salt, pepper);

        expect(hashResponse.length).toBe(128);
        expect(await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(true, "await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)");

        done();
    });

    it("should be able to hash password using pbkdf2 and validate the password", async done => {
        config.hashingAlgorithm = "pbkdf2";

        const password = " hello";
        const id = "user-id";
        const passwordService = new PasswordService();
        const salt = passwordService._generateSalt();
        const hashDate = new Date();
        const pepper = passwordService._generatePepper(id, password, hashDate);
        const hashResponse = await passwordService._hashPassword(password, salt, pepper);

        expect(hashResponse.length).toBe(128);
        expect(await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(true, "await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)");

        done();
    });

    it("should not be able to login with sha512 password if config is set to pbkdf2", async done => {
        config.hashingAlgorithm = "sha512";

        const password = " hello";
        const id = "user-id";
        const passwordService = new PasswordService();
        const salt = passwordService._generateSalt();
        const hashDate = new Date();
        const pepper = passwordService._generatePepper(id, password, hashDate);
        const hashResponse = await passwordService._hashPassword(password, salt, pepper);

        config.hashingAlgorithm = "pbkdf2";

        expect(await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(false, "await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)");

        done();
    });

    it("should not be able to login with pbkdf2 password if config is set to sha512", async done => {
        config.hashingAlgorithm = "pbkdf2";

        const password = " hello";
        const id = "user-id";
        const passwordService = new PasswordService();
        const salt = passwordService._generateSalt();
        const hashDate = new Date();
        const pepper = passwordService._generatePepper(id, password, hashDate);
        const hashResponse = await passwordService._hashPassword(password, salt, pepper);

        config.hashingAlgorithm = "sha512";

        expect(await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)).toBe(false, "await passwordService.validatePassword(hashResponse, salt, id, password, hashDate)");

        done();
    });


});