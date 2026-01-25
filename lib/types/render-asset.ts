/**
 * A single post-processing action for a PSD template layer.
 */
export interface PostAction {
  /** Target Photoshop layer name (e.g., ARTIST, TITLE, IMAGE, IMAGE_NOBG) */
  layerName: string;
  /** Photoshop action to execute (e.g., DynamicTextAdjustH, DynamicTextAdjustHV) */
  actionName: string;
}

/**
 * Render asset configuration for a PSD template.
 * Stores post-processing actions to be applied after rendering.
 */
export interface RenderAsset {
  _id?: string;
  /** Unique identifier, typically the PSD S3 key (e.g., 'backdrop/backdrop.psd') */
  key: string;
  /** List of post-processing actions to apply */
  postActions: PostAction[];
}

/**
 * Request body for creating a new render asset.
 */
export interface CreateRenderAssetInput {
  key: string;
  postActions: PostAction[];
}

/**
 * Request body for updating a render asset.
 */
export interface UpdateRenderAssetInput {
  key?: string;
  postActions?: PostAction[];
}

/** Preset action names for the dropdown */
export const ACTION_NAME_PRESETS = [
  'DynamicTextAdjustH',
  'DynamicTextAdjustHV',
] as const;

/** Preset layer names for the dropdown */
export const LAYER_NAME_PRESETS = [
  'ARTIST',
  'TITLE',
  'IMAGE',
  'IMAGE_NOBG',
] as const;
