import { AchievementDescriptions, AchievementName } from '../../types';

export const achievementCatalog: AchievementDescriptions = {
  [AchievementName.FRIDGE]: {
    fullName: 'Fridge door',
    description: "If you don't like what you've found inside - maybe throw it outside?",
  },
  [AchievementName.HARNAS]: {
    fullName: 'Kraft Beer Lover',
    description: 'Throw harnas through an open window.',
  },
  [AchievementName.AT]: {
    fullName: 'Letter T',
    description: 'Ultra rare piece 1/4',
  },
  [AchievementName.BO]: {
    fullName: 'Letter O',
    description: 'Ultra rare piece 2/4',
  },
  [AchievementName.CU]: {
    fullName: 'Letter U',
    description: 'Ultra rare piece 3/4',
  },
  [AchievementName.DK]: {
    fullName: 'Letter K',
    description: 'Ultra rare piece 4/4',
  },
  [AchievementName.NEON]: {
    fullName: 'Neon sign',
    description: 'Found a way to turn on the neon light.',
  },
  [AchievementName.WINDOW]: {
    fullName: 'Window',
    description: 'window.open(), but in 3D',
  },
  [AchievementName.COFFEE]: {
    fullName: 'Barista',
    description: 'There is no milk here, sorry...',
  },
};
