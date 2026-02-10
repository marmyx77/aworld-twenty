import * as path from 'path';

import { type CategoryConfig } from './CategoryConfig';
import { TWENTY_UI_ROOT_PATH } from './TwentyUiRootPath';

const TWENTY_UI_SRC_PATH = path.join(TWENTY_UI_ROOT_PATH, 'src');

export const COMPONENT_CATEGORIES: CategoryConfig[] = [
  {
    category: 'input',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'input/index.ts'),
  },
  {
    category: 'components',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'components/index.ts'),
  },
  {
    category: 'display',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'display/index.ts'),
  },
  {
    category: 'feedback',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'feedback/index.ts'),
  },
  {
    category: 'layout',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'layout/index.ts'),
  },
  {
    category: 'navigation',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'navigation/index.ts'),
  },
  {
    category: 'accessibility',
    indexPath: path.join(TWENTY_UI_SRC_PATH, 'accessibility/index.ts'),
  },
];
