import { ObjectId } from "mongodb";
import { Design } from "./design";

export interface Collection {
  _id?: ObjectId | string;
  slug: string;
  name: string;
  description: string;
  designIds: string[];
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionWithDesigns extends Omit<Collection, 'designIds'> {
  designs: Design[];
}

export interface CreateCollectionRequest {
  slug: string;
  name: string;
  description: string;
  position?: number;
}

export interface CreateCollectionResponse {
  success: boolean;
  collection?: Collection;
  error?: string;
}

export interface UpdateCollectionDesignsResponse {
  success: boolean;
  error?: string;
}

export interface HomeFeedResponse {
  collections: CollectionWithDesigns[];
  recentDesigns: Design[];
}

export interface UpdatePositionRequest {
  slug: string;
  position: number;
}
