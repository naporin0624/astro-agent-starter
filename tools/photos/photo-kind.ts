export type PhotoKind = 'photo' | 'heic' | 'ignored' | 'unsupported';

const photoExtensions: ReadonlySet<string> = new Set(['jpg', 'jpeg', 'png', 'webp']);
const heicExtensions: ReadonlySet<string> = new Set(['heic', 'heif']);

const toExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
};

export const toPhotoKind = (fileName: string): PhotoKind => {
  if (fileName.startsWith('.')) return 'ignored';
  const extension = toExtension(fileName);
  if (photoExtensions.has(extension)) return 'photo';
  if (heicExtensions.has(extension)) return 'heic';
  return 'unsupported';
};
