import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db/mongodb';
import { Design, Order, Collection, Macro } from '@/lib/types';

export class MongoDbService {
  // Design Operations
  static async getAllDesigns(): Promise<Design[]> {
    const collection = await getCollection<Design>(COLLECTIONS.DESIGNS);
    return await collection.find({}).toArray();
  }

  static async getDesignById(id: string): Promise<Design | null> {
    const collection = await getCollection<Design>(COLLECTIONS.DESIGNS);
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async createDesign(design: Omit<Design, '_id'>): Promise<Design> {
    const collection = await getCollection<Design>(COLLECTIONS.DESIGNS);
    const result = await collection.insertOne(design as Design);
    return { ...design, _id: result.insertedId } as Design;
  }

  static async updateDesign(id: string, design: Partial<Design>): Promise<boolean> {
    const collection = await getCollection<Design>(COLLECTIONS.DESIGNS);
    const { _id, ...updateData } = design;
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  static async deleteDesign(id: string): Promise<boolean> {
    const collection = await getCollection<Design>(COLLECTIONS.DESIGNS);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Order Operations
  static async getAllOrders(): Promise<Order[]> {
    const collection = await getCollection<Order>(COLLECTIONS.ORDERS);
    return await collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  static async getOrderById(id: string): Promise<Order | null> {
    const collection = await getCollection<Order>(COLLECTIONS.ORDERS);
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async updateOrder(id: string, order: Partial<Order>): Promise<boolean> {
    const collection = await getCollection<Order>(COLLECTIONS.ORDERS);
    const { _id, ...updateData } = order;
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  // Collection Operations
  static async getAllCollections(includeInactive: boolean = false): Promise<Collection[]> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const filter = includeInactive ? {} : { isActive: true };
    return await collection.find(filter).sort({ position: 1 }).toArray();
  }

  static async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    return await collection.findOne({ slug });
  }

  static async createCollection(collectionData: Omit<Collection, '_id'>): Promise<Collection> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const result = await collection.insertOne(collectionData as Collection);
    return { ...collectionData, _id: result.insertedId } as Collection;
  }

  static async updateCollection(slug: string, data: Partial<Collection>): Promise<boolean> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const { _id, ...updateData } = data;
    const result = await collection.updateOne(
      { slug },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  static async deleteCollection(slug: string): Promise<boolean> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const result = await collection.deleteOne({ slug });
    return result.deletedCount > 0;
  }

  static async updateCollectionDesigns(slug: string, designIds: string[]): Promise<boolean> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const result = await collection.updateOne(
      { slug },
      { $set: { designIds, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async setCollectionActiveStatus(slug: string, isActive: boolean): Promise<boolean> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const result = await collection.updateOne(
      { slug },
      { $set: { isActive, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async updateCollectionPositions(updates: { slug: string; position: number }[]): Promise<boolean> {
    const collection = await getCollection<Collection>(COLLECTIONS.COLLECTIONS);
    const bulkOps = updates.map(({ slug, position }) => ({
      updateOne: {
        filter: { slug },
        update: { $set: { position, updatedAt: new Date() } }
      }
    }));

    const result = await collection.bulkWrite(bulkOps);
    return result.modifiedCount > 0;
  }

  // Macro Operations
  static async getAllMacros(): Promise<Macro[]> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    return await collection.find({}).toArray();
  }

  static async getMacroById(id: string): Promise<Macro | null> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    return await collection.findOne({ id });
  }

  static async createMacro(macro: Omit<Macro, '_id'>): Promise<Macro> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    const result = await collection.insertOne(macro as Macro);
    return { ...macro, _id: result.insertedId } as Macro;
  }

  static async updateMacro(id: string, macro: Partial<Macro>): Promise<boolean> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    const { _id, ...updateData } = macro;
    const result = await collection.updateOne(
      { id },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  static async deleteMacro(id: string): Promise<boolean> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  static async macroIdExists(id: string): Promise<boolean> {
    const collection = await getCollection<Macro>(COLLECTIONS.MACROS);
    const count = await collection.countDocuments({ id });
    return count > 0;
  }
}
