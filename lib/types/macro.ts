import { ObjectId } from "mongodb";

export interface MacroProcess {
  processType: string;
  opacity: number;
  brightness?: number | null;
  contrast?: number | null;
  hueShift?: number | null;
  saturationScale?: number | null;
  lightnessAdjust?: number | null;
  colorize?: boolean | null;
  colorizeHue?: number | null;
  colorizeSaturation?: number | null;
  useAdvancedGradient?: boolean | null;
  startColor?: number[] | null;
  endColor?: number[] | null;
}

export interface Macro {
  _id?: ObjectId | string;
  id: string; // String-based ID (generated from name)
  name: string;
  description: string;
  content: string; // Plain text content
  isActive: boolean;
  macroProcesses?: MacroProcess[] | null;
}

export interface CreateMacroInput {
  name: string;
  description: string;
  content: string;
  isActive: boolean;
  macroProcesses?: MacroProcess[] | null;
}

export interface UpdateMacroInput extends CreateMacroInput {
  id: string;
}
