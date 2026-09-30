import sharp from 'sharp';

type SampleFormat = 'jpeg' | 'png' | 'webp';

type SampleOptions = {
  readonly width: number;
  readonly height: number;
  readonly format: SampleFormat;
  readonly withPrivateExif: boolean;
};

const privateExif = {
  IFD0: { Make: 'SampleMaker', Model: 'SamplePhone 1', DateTime: '2026:10:01 14:30:00' },
  IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '34/1 30/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '135/1 30/1 0/1' },
};

export const makeSamplePhoto = async ({ width, height, format, withPrivateExif }: SampleOptions): Promise<Buffer> => {
  const base = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } }).toFormat(
    format,
  );
  return withPrivateExif ? base.withExif(privateExif).toBuffer() : base.toBuffer();
};

export const makeRotatedSamplePhoto = async (): Promise<Buffer> =>
  sharp({ create: { width: 40, height: 20, channels: 3, background: { r: 10, g: 10, b: 10 } } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
