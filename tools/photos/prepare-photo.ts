import sharp from 'sharp';

// sharp は keepExif / withMetadata を呼ばない限り EXIF・XMP・IPTC を書き出さない。
// autoOrient で向きを画素に焼いてから落とすので、縦の写真が横倒しにならない。
export const preparePhoto = async (photo: Buffer, maxEdge: number): Promise<Buffer> =>
  sharp(photo)
    .autoOrient()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .toBuffer();
