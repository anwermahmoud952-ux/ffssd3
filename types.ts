export enum GameState {
  TUTORIAL,
  WEATHER_INPUT,
  PLAYING,
  GAME_OVER,
}

export type SoilType = 'SILTY' | 'SANDY' | 'CHALKY' | 'SALINE' | 'ROCKY';
export type CropName = string; // Example: 'الذرة الشامية', 'القمح'

export interface FarmStats {
  cropHealth: number; // 0-100
  soilMoisture: number; // 0-100
  waterReserves: number; // 0-100
  soilType: SoilType;
  cropType: CropName;
}

export interface ScenarioData {
  temperature: number; // Celsius
  rainfall: number; // mm
  soilMoisture: number; // %
  ndvi: number; // Normalized Difference Vegetation Index (0-1)
  humidity: number; // %
  windSpeed: number; // km/h
  cloudCover: number; // %
  pressure: number; // hPa
}

export interface Scenario {
  narrative: string;
  challenge: string;
  data: ScenarioData;
}

export type Action = 'IRRIGATE' | 'FERTILIZE' | 'CONSERVE' | 'PEST_CONTROL';

export interface Outcome {
  narrative: string;
  updatedStats: FarmStats;
}

export interface HistoryEntry {
  round: number;
  scenario: Scenario;
  action: Action;
  outcome: Outcome;
}