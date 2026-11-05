import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let database: Db | null = null;

export const connectDB = async (): Promise<Db> => {
  if (database) return database;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  client = new MongoClient(uri);

  await client.connect();

  database = client.db(
    process.env.MONGODB_DB || "studiospace_app"
  );

  console.log("MongoDB connected successfully!");

  return database;
};

export const getDB = (): Db => {
  if (!database) {
    throw new Error("Database is not connected!");
  }

  return database;
};

export const getMongoClient = (): MongoClient => {
  if (!client) {
    throw new Error("MongoDB client is not connected!");
  }

  return client;
};