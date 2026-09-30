import { fileURLToPath } from 'node:url';

import { preparePhotos } from './prepare-photos.ts';
import type { PrepareReport } from './prepare-photos.ts';

const photosDir = fileURLToPath(new URL('../../photos', import.meta.url));
const maxEdge = 2400;

const rejectionReasons = {
  heic: 'HEIC は同梱の sharp（libheif は AV1 だけ）では読めません。JPEG に書き出してから入れ直してください（iPhone: 設定 > カメラ > フォーマット > 互換性優先、Mac: `sips -s format jpeg in.heic --out out.jpg`）',
  unsupported: '写真ではない形式です（jpg / jpeg / png / webp だけを置けます）。photos/ から外してください',
  unreadable: '画像として読めませんでした。壊れていないか確かめてください',
} as const;

const describeReport = (report: PrepareReport): string =>
  report.status === 'rejected'
    ? `NG  ${report.file}: ${rejectionReasons[report.problem]}`
    : `ok  ${report.file}: ${report.status === 'prepared' ? 'メタデータを消して縮めました' : 'そのまま'}`;

const reports = await preparePhotos(photosDir, maxEdge);
reports.forEach((report) => console.log(describeReport(report)));
if (reports.some((report) => report.status === 'rejected')) process.exitCode = 1;
