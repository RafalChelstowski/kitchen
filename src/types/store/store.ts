export enum InteractiveObjectStatus {
  ATTACHED_EXPRESS = 'attachedExpress',
  PICKED = 'picked',
  ANIMATED = 'animated',
  ANIMATED_EXPRESS = 'animatedExpress',
  ANIMATED_GRINDER = 'animatedGrinder',
  ANIMATED_ACCESSORIES = 'animatedAccessories',
  DROPPED = 'dropped',
  ON = 'on',
  OFF = 'off',
  HIDDEN = 'hidden',
}

export enum PlayerStatus {
  PICKED = 'picked',
}

export enum AchievementName {
  FRIDGE = 'fridge',
  HARNAS = 'harnas',
  AT = 'at',
  BO = 'bo',
  CU = 'cu',
  DK = 'dk',
  NEON = 'neon',
  WINDOW = 'window',
  COFFEE = 'coffee',
}

export interface AchievementDescription {
  description: string;
  fullName: string;
}

export type AchievementDescriptions = Record<
  AchievementName,
  AchievementDescription
>;

export enum AchievementPayloadStatus {
  NEW = 'new',
  VIEWED = 'viewed',
}

export type AchievementPayload = {
  date: string;
  status: AchievementPayloadStatus;
};

export type Achievements = Partial<Record<AchievementName, AchievementPayload>>;

export interface InteractiveLetters {
  t?: boolean;
  o?: boolean;
  u?: boolean;
  k?: boolean;
}

export interface GfxSettings {
  surroundings: boolean;
  lights: number;
  glass: boolean;
}

export type State = {
  coffeeState:
    | 'grinded'
    | 'tempered'
    | 'gripAttached'
    | 'cupReady'
    | 'inProgress'
    | 'ready'
    | null;
  achievements: Achievements;
  gfxSettings: GfxSettings;
  letters: InteractiveLetters;
  setAchievement: (name: AchievementName, payload: AchievementPayload) => void;
  setAchievements: (obj: Achievements) => void;
  playerStatus: PlayerStatus | null;
  isLocked: boolean;
  markAchievementViewed: (name: AchievementName) => void;
  toggleIsLocked: () => void;
  setPlayerStatus: (status: PlayerStatus | null) => void;
};
