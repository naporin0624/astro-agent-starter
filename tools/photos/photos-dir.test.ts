import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { auditPhotos } from './audit-photos.ts';

const photosDir = fileURLToPath(new URL('../../photos', import.meta.url));

describe('photos/', () => {
  it('holds no photo that still carries EXIF / XMP / IPTC or skipped `pnpm photos`', async () => {
    expect(await auditPhotos(photosDir)).toEqual([]);
  });
});
