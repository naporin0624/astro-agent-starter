import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { auditPhotos } from './audit-photos.ts';
import { makeSamplePhoto } from './sample-photo.ts';

describe('auditPhotos', () => {
  let dir = '';

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'audit-photos-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('passes a directory with only .gitkeep', async () => {
    await writeFile(join(dir, '.gitkeep'), '');

    expect(await auditPhotos(dir)).toEqual([]);
  });

  it('passes a clean photo', async () => {
    await writeFile(
      join(dir, 'stage.jpg'),
      await makeSamplePhoto({ width: 8, height: 8, format: 'jpeg', withPrivateExif: false }),
    );

    expect(await auditPhotos(dir)).toEqual([]);
  });

  it('reports a photo that still has EXIF', async () => {
    await writeFile(
      join(dir, 'stage.jpg'),
      await makeSamplePhoto({ width: 8, height: 8, format: 'jpeg', withPrivateExif: true }),
    );

    expect(await auditPhotos(dir)).toEqual([{ file: 'stage.jpg', problem: 'metadata', kinds: ['exif'] }]);
  });

  it('reports a HEIC and an unsupported file without reading them', async () => {
    await writeFile(join(dir, 'IMG_0001.HEIC'), 'not really heic');
    await writeFile(join(dir, 'clip.mov'), 'not really a movie');

    expect(await auditPhotos(dir)).toEqual([
      { file: 'IMG_0001.HEIC', problem: 'heic' },
      { file: 'clip.mov', problem: 'unsupported' },
    ]);
  });

  it('reports a photo it cannot decode', async () => {
    await writeFile(join(dir, 'broken.png'), 'not a png');

    expect(await auditPhotos(dir)).toEqual([{ file: 'broken.png', problem: 'unreadable' }]);
  });
});
