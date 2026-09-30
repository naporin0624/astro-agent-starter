import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { findPrivateMetadata } from './find-private-metadata.ts';
import { preparePhoto } from './prepare-photo.ts';
import { makeRotatedSamplePhoto, makeSamplePhoto } from './sample-photo.ts';

describe('preparePhoto', () => {
  it.each(['jpeg', 'png', 'webp'] as const)('strips EXIF from a %s and keeps its format', async (format) => {
    const photo = await makeSamplePhoto({ width: 16, height: 8, format, withPrivateExif: true });

    const prepared = await preparePhoto(photo, 2400);

    expect(await findPrivateMetadata(prepared)).toEqual([]);
    expect((await sharp(prepared).metadata()).format).toBe(format);
  });

  it('shrinks the long edge to the limit and keeps the aspect ratio', async () => {
    const photo = await makeSamplePhoto({ width: 300, height: 150, format: 'jpeg', withPrivateExif: false });

    const { width, height } = await sharp(await preparePhoto(photo, 100)).metadata();

    expect({ width, height }).toEqual({ width: 100, height: 50 });
  });

  it('does not enlarge a photo smaller than the limit', async () => {
    const photo = await makeSamplePhoto({ width: 30, height: 60, format: 'png', withPrivateExif: false });

    const { width, height } = await sharp(await preparePhoto(photo, 100)).metadata();

    expect({ width, height }).toEqual({ width: 30, height: 60 });
  });

  it('applies the EXIF orientation to the pixels before dropping it', async () => {
    const { width, height, orientation } = await sharp(
      await preparePhoto(await makeRotatedSamplePhoto(), 2400),
    ).metadata();

    expect({ width, height, orientation }).toEqual({ width: 20, height: 40, orientation: undefined });
  });
});
