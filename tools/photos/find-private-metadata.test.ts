import { describe, expect, it } from 'vitest';

import { findPrivateMetadata } from './find-private-metadata.ts';
import { makeSamplePhoto } from './sample-photo.ts';

describe('findPrivateMetadata', () => {
  it.each(['jpeg', 'png', 'webp'] as const)('finds EXIF written into a %s', async (format) => {
    const photo = await makeSamplePhoto({ width: 8, height: 8, format, withPrivateExif: true });

    expect(await findPrivateMetadata(photo)).toContain('exif');
  });

  it.each(['jpeg', 'png', 'webp'] as const)('finds nothing in a clean %s', async (format) => {
    const photo = await makeSamplePhoto({ width: 8, height: 8, format, withPrivateExif: false });

    expect(await findPrivateMetadata(photo)).toEqual([]);
  });
});
