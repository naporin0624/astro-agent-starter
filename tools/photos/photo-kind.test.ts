import { describe, expect, it } from 'vitest';

import { toPhotoKind } from './photo-kind.ts';

describe('toPhotoKind', () => {
  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.webp', 'IMG_0001.JPG', 'b.JPEG', 'c.PnG'])('%s is a photo', (name) => {
    expect(toPhotoKind(name)).toBe('photo');
  });

  it.each(['IMG_0001.HEIC', 'a.heic', 'a.heif', 'a.HEIF'])('%s is heic', (name) => {
    expect(toPhotoKind(name)).toBe('heic');
  });

  it.each(['.gitkeep', '.DS_Store'])('%s is ignored', (name) => {
    expect(toPhotoKind(name)).toBe('ignored');
  });

  it.each(['clip.mov', 'notes.txt', 'raw.dng', 'no-extension'])('%s is unsupported', (name) => {
    expect(toPhotoKind(name)).toBe('unsupported');
  });
});
