import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export const startMongoDb = async () => {
	mongod = await MongoMemoryServer.create();
	return mongod.getUri();
};

export const stopMongoDb = async () => {
	await mongod?.stop();
};

export const getMongoUrl = () => mongod.getUri();
