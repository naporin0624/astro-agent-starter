import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import sharp from 'sharp';

import { findPrivateMetadata } from './find-private-metadata.ts';
import type { PrivateMetadataKind } from './find-private-metadata.ts';

export type PhotoFacts = {
  readonly metadata: readonly PrivateMetadataKind[];
  readonly longEdge: number;
};

export class UnreadablePhotoError extends Error {
  override readonly name = 'UnreadablePhotoError';
}

export const inspectPhoto = async (photo: Buffer): Promise<Result<PhotoFacts, UnreadablePhotoError>> => {
  try {
    const { width, height } = await sharp(photo).metadata();
    return ok({ metadata: await findPrivateMetadata(photo), longEdge: Math.max(width, height) });
  } catch (e) {
    return err(new UnreadablePhotoError('sharp could not decode the photo', { cause: e }));
  }
};
