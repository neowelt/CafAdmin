import { ObjectId } from "mongodb";

export interface DesignFont {
  fileName: string;
}

export interface DesignStyle {
  styleName: string;
  artistTag: string;
  titleTag: string;
  artistCaseMode: string;
  titleCaseMode: string;
  artistNameMaxCharacters: number;
  titleMaxCharacters: number;
  isDefault: boolean;
  featuring: boolean;
  preview: string;
  fileName: string;
  titleLines: number;
  artistLines: number;
}

export interface Design {
  _id?: ObjectId | string;
  templateName: string;
  description: string;
  overview: string;
  preview: string;
  productTier: string;
  appleProductId: string;
  published: boolean;
  allowCustomImage: boolean;
  customImageWidth: number;
  customImageHeight: number;
  customImageBgTransparency: boolean;
  fonts: DesignFont[];
  styles: DesignStyle[];
  macroIds: string[];
  version: number;
}

// Form types for creating/updating designs
export interface CreateDesignInput {
  templateName: string;
  description: string;
  overview: string;
  preview: string;
  productTier: string;
  appleProductId: string;
  published: boolean;
  allowCustomImage: boolean;
  customImageWidth: number;
  customImageHeight: number;
  customImageBgTransparency: boolean;
  fonts: DesignFont[];
  styles: DesignStyle[];
  macroIds: string[];
  version: number;
}

export interface UpdateDesignInput extends CreateDesignInput {
  _id: string;
}
