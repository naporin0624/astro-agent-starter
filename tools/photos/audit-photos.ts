import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { PrivateMetadataKind } from './find-private-metadata.ts';
import { inspectPhoto } from './inspect-photo.ts';
import { listPhotoFiles } from './list-photo-files.ts';
import type { PhotoFile } from './list-photo-files.ts';

export type AuditFinding =
  | { readonly file: string; readonly problem: 'heic' | 'unsupported' | 'unreadable' }
  | { readonly file: string; readonly problem: 'metadata'; readonly kinds: readonly PrivateMetadataKind[] };

const auditPhoto = async (dir: string, { file, kind }: PhotoFile): Promise<readonly AuditFinding[]> => {
  if (kind !== 'photo') return [{ file, problem: kind }];
  const facts = await inspectPhoto(await readFile(join(dir, file)));
  return facts.match(
    ({ metadata }): readonly AuditFinding[] =>
      metadata.length === 0 ? [] : [{ file, problem: 'metadata', kinds: metadata }],
    () => [{ file, problem: 'unreadable' }],
  );
};

export const auditPhotos = async (dir: string): Promise<readonly AuditFinding[]> =>
  (await listPhotoFiles(dir)).reduce<Promise<readonly AuditFinding[]>>(
    async (found, photo) => [...(await found), ...(await auditPhoto(dir, photo))],
    Promise.resolve([]),
  );
