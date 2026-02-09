import * as path from 'path';

import { type CategoryConfig } from './CategoryConfig';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, '../../../../../../..');
const TWENTY_UI_ROOT = path.join(WORKSPACE_ROOT, 'packages/twenty-ui');
const TWENTY_UI_SRC = path.join(TWENTY_UI_ROOT, 'src');

export const COMPONENT_CATEGORIES: CategoryConfig[] = [
  { category: 'input', indexPath: path.join(TWENTY_UI_SRC, 'input/index.ts') },
  {
    category: 'components',
    indexPath: path.join(TWENTY_UI_SRC, 'components/index.ts'),
  },
  {
    category: 'display',
    indexPath: path.join(TWENTY_UI_SRC, 'display/index.ts'),
  },
  {
    category: 'feedback',
    indexPath: path.join(TWENTY_UI_SRC, 'feedback/index.ts'),
  },
  {
    category: 'layout',
    indexPath: path.join(TWENTY_UI_SRC, 'layout/index.ts'),
  },
  {
    category: 'navigation',
    indexPath: path.join(TWENTY_UI_SRC, 'navigation/index.ts'),
  },
  {
    category: 'accessibility',
    indexPath: path.join(TWENTY_UI_SRC, 'accessibility/index.ts'),
  },
];
