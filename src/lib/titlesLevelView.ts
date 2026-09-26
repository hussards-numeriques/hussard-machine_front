import type { Level } from './grades';
import type { MyTitlesResponse } from '../services/quests';

export type TitlesLevelView =
  | { kind: 'active'; level: Level }
  | { kind: 'inactive-memories'; level: Level; currentLevel: Level }
  | { kind: 'inactive-empty'; level: Level; currentLevel: Level };

const hasMemories = (response: MyTitlesResponse): boolean =>
  response.titles.length > 0 || response.quests.some((quest) => quest.progress > 0);

export const resolveTitlesLevelView = (response: MyTitlesResponse): TitlesLevelView => {
  if (response.level === response.current_level) {
    return { kind: 'active', level: response.level };
  }

  const kind = hasMemories(response) ? 'inactive-memories' : 'inactive-empty';
  return { kind, level: response.level, currentLevel: response.current_level };
};
