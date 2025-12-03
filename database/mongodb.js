const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectDB() {
	if (db) return db;

	try {
		const uri = process.env.MONGO_URI;
		const dbName = process.env.MONGO_DATABASE;

		if (!uri || !dbName) {
			throw new Error('MONGO_URI and MONGO_DATABASE must be defined in environment variables');
		}

		client = new MongoClient(uri);
		await client.connect();
		db = client.db(dbName);

		return db;
	}
	catch (error) {
		console.error('Error connecting to MongoDB:', error);
		throw error;
	}
}

async function getPlayersCollection() {
	const database = await connectDB();
	return database.collection('players');
}

async function getAllPlayers() {
	try {
		const collection = await getPlayersCollection();
		const players = await collection.find({}).toArray();
		return players;
	}
	catch (error) {
		console.error('Error fetching players:', error);
		throw error;
	}
}

async function closeDB() {
	if (client) {
		await client.close();
		client = null;
		db = null;
	}
}

module.exports = {
	connectDB,
	getPlayersCollection,
	getAllPlayers,
	closeDB,
};
