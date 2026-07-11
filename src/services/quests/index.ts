import { HttpQuestsAdapter } from './HttpQuestsAdapter';
import type { QuestsRepository } from './port';

export const questsRepository: QuestsRepository = new HttpQuestsAdapter();
export type {
  AuthorizedFetch,
  MyQuest,
  MyQuestTier,
  MyTitle,
  MyTitlesResponse,
  Quest,
  QuestCatalog,
  QuestsRepository,
  QuestTier,
  QuestTitle,
} from './port';
