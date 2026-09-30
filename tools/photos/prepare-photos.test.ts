import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { auditPhotos } from './audit-photos.ts';
import { preparePhotos } from './prepare-photos.ts';
import { makeSamplePhoto } from './sample-photo.ts';

describe('preparePhotos', () => {
  let dir = '';

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'prepare-photos-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('rewrites a photo in place without EXIF and within the long edge', async () => {
    await writeFile(
      join(dir, 'stage.jpg'),
      await makeSamplePhoto({ width: 300, height: 100, format: 'jpeg', withPrivateExif: true }),
    );

    const reports = await preparePhotos(dir, 150);

    expect(reports).toEqual([{ file: 'stage.jpg', status: 'prepared' }]);
    expect(await auditPhotos(dir)).toEqual([]);
    expect((await sharp(join(dir, 'stage.jpg')).metadata()).width).toBe(150);
  });

  it('leaves a clean photo within the limit untouched so re-running does not re-encode it', async () => {
    const clean = await makeSamplePhoto({ width: 40, height: 20, format: 'webp', withPrivateExif: false });
    await writeFile(join(dir, 'hands.webp'), clean);

    expect(await preparePhotos(dir, 150)).toEqual([{ file: 'hands.webp', status: 'unchanged' }]);
    expect(await readFile(join(dir, 'hands.webp'))).toEqual(clean);
  });

  it('rejects HEIC, unsupported and unreadable files, and skips dotfiles', async () => {
    await writeFile(join(dir, '.gitkeep'), '');
    await writeFile(join(dir, 'IMG_0001.HEIC'), 'heic');
    await writeFile(join(dir, 'clip.mov'), 'mov');
    await writeFile(join(dir, 'broken.png'), 'not a png');

    expect(await preparePhotos(dir, 150)).toEqual([
      { file: 'IMG_0001.HEIC', status: 'rejected', problem: 'heic' },
      { file: 'broken.png', status: 'rejected', problem: 'unreadable' },
      { file: 'clip.mov', status: 'rejected', problem: 'unsupported' },
    ]);
  });
});
