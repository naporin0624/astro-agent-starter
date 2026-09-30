import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { inspectPhoto } from './inspect-photo.ts';
import type { PhotoFacts } from './inspect-photo.ts';
import { listPhotoFiles } from './list-photo-files.ts';
import type { PhotoFile } from './list-photo-files.ts';
import { preparePhoto } from './prepare-photo.ts';

export type PrepareReport =
  | { readonly file: string; readonly status: 'prepared' | 'unchanged' }
  | { readonly file: string; readonly status: 'rejected'; readonly problem: 'heic' | 'unsupported' | 'unreadable' };

const isAlreadyPrepared = ({ metadata, longEdge }: PhotoFacts, maxEdge: number): boolean =>
  metadata.length === 0 && longEdge <= maxEdge;

const prepareOne = async (dir: string, { file, kind }: PhotoFile, maxEdge: number): Promise<PrepareReport> => {
  if (kind !== 'photo') return { file, status: 'rejected', problem: kind };
  const path = join(dir, file);
  const photo = await readFile(path);
  const facts = await inspectPhoto(photo);
  if (facts.isErr()) return { file, status: 'rejected', problem: 'unreadable' };
  if (isAlreadyPrepared(facts.value, maxEdge)) return { file, status: 'unchanged' };
  await writeFile(path, await preparePhoto(photo, maxEdge));
  return { file, status: 'prepared' };
};

export const preparePhotos = async (dir: string, maxEdge: number): Promise<readonly PrepareReport[]> =>
  (await listPhotoFiles(dir)).reduce<Promise<readonly PrepareReport[]>>(
    async (reports, photo) => [...(await reports), await prepareOne(dir, photo, maxEdge)],
    Promise.resolve([]),
  );
