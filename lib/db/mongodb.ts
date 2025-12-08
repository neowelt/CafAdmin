import { MongoClient, Db, Collection as MongoCollection, Document } from 'mongodb';
import { getMongoDBUri, getDatabaseName } from '@/lib/services/secrets-manager';

// MongoDB URI and database name will be fetched from env vars or AWS Secrets Manager
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.DATABASE_NAME || 'cafapp';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getCollection<T extends Document>(collectionName: string): Promise<MongoCollection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

// Collection names as constants
export const COLLECTIONS = {
  DESIGNS: 'templates',
  ORDERS: 'orders',
  COLLECTIONS: 'collections',
  MACROS: 'macros',
} as const;

export default clientPromise;
