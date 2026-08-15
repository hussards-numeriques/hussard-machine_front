import { HttpIconsAdapter } from './HttpIconsAdapter';
import type { IconsRepository } from './port';

export const iconsRepository: IconsRepository = new HttpIconsAdapter();
export type {
  AuthorizedFetch,
  IconCatalog,
  IconsRepository,
  MyIcon,
  MyIconsResponse,
  PlayerIcon,
} from './port';
