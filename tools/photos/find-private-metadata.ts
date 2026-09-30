import sharp from 'sharp';

export type PrivateMetadataKind = 'exif' | 'xmp' | 'iptc' | 'comments';

export const findPrivateMetadata = async (photo: Buffer): Promise<readonly PrivateMetadataKind[]> => {
  const { exif, xmp, iptc, comments } = await sharp(photo).metadata();
  const found: readonly (readonly [PrivateMetadataKind, boolean])[] = [
    ['exif', exif !== undefined],
    ['xmp', xmp !== undefined],
    ['iptc', iptc !== undefined],
    ['comments', comments !== undefined && comments.length > 0],
  ];
  return found.filter(([, present]) => present).map(([kind]) => kind);
};
