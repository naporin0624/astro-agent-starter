import { readdir } from 'node:fs/promises';

import { toPhotoKind } from './photo-kind.ts';
import type { PhotoKind } from './photo-kind.ts';

export type PhotoFile = {
  readonly file: string;
  readonly kind: Exclude<PhotoKind, 'ignored'>;
};

const byCodeUnit = (a: string, b: string): number => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

export const listPhotoFiles = async (dir: string): Promise<readonly PhotoFile[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .toSorted(byCodeUnit)
    .flatMap((file) => {
      const kind = toPhotoKind(file);
      return kind === 'ignored' ? [] : [{ file, kind }];
    });
};
