---
description: Event photos live in photos/, go through `pnpm photos` before commit, and are shown only through astro:assets (<Image> / <Picture> / getImage) with a real alt
paths:
  - 'photos/**'
  - 'src/**/*.{astro,ts,tsx}'
---

# Images (event photos)

写真はリポジトリの履歴に残る。一度 push した GPS は消せないので、AI の注意ではなく仕組みで守る。

## Where

| Put it | Never |
| --- | --- |
| `photos/`（リポジトリ直下。空のときは `.gitkeep` だけ） | `public/` — 最適化されずに原本がそのまま配信される |
| jpg / jpeg / png / webp | HEIC / HEIF・動画・RAW — `pnpm photos` と `photos/` のテストが止める |

顔が写っている写真は入れない（壇上・スクリーン・会場の後ろ姿・手元だけ）。これは機械で判定できないので、入れる人が見て決める。

## Before commit: `pnpm photos`

```sh
mise exec -- pnpm photos
```

- `photos/` の各ファイルを、同じ場所に書き戻す: EXIF・XMP・IPTC（GPS・端末名・撮影日時）を消し、EXIF の向きを画素に焼き、長辺を 2400px 以下にする（`tools/photos/`）
- 消し済みで長辺が収まっている写真は触らない（何度走らせても再圧縮しない）
- HEIC は拒否する。同梱の sharp（libheif は AV1 だけ）は iPhone の HEIC（HEVC）を読めないので、JPEG に書き出してから入れ直す
- `tools/photos/photos-dir.test.ts` は、メタデータが残った写真・HEIC・写真でないファイルがあると落ちる。`pnpm test:run` でも、写真を commit するときの lint-staged（`pnpm photos:check`）でも走る。フックを skip しない

## Show: astro:assets only

`photos/` の画像は `import.meta.glob` で `ImageMetadata` にして、`<Image>` / `<Picture>` に**オブジェクトのまま**渡す。build 時に sharp が縮小・変換し、`base` 付きの URL（`/llm-series-03/_astro/...`）と `width` / `height` が出る。

```astro
---
import type { ImageMetadata } from 'astro';
import { Picture } from 'astro:assets';

import { photoAlts } from './photo-alts';

const photos = Object.entries(
  import.meta.glob<ImageMetadata>('/photos/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }),
);
---
<ul>
  {photos.map(([path, photo]) => (
    <li><Picture src={photo} alt={photoAlts[path]} formats={['avif', 'webp']} widths={[480, 960, 1600]} sizes="(min-width: 960px) 50vw, 100vw" /></li>
  ))}
</ul>
```

- Bad: `<img src="/photos/a.jpg">`、`<Image src={photo.src}>`（文字列を渡すと最適化されない / `LocalImageUsedWrongly`）、写真を `public/` にコピーする
- React island の中では `<Image>` は使えない。Astro 側で `<Picture>` を描いて island の children / slot に渡すか、frontmatter で `getImage({ src: photo, width: 1024, format: 'webp' })` を呼び、結果の `src` を props で渡す（WebGPU のテクスチャはこちら）。`getImage` を並べるときは `Promise.all` ではなく for-of か reduce で順に待つ
- `photos/` から外した写真は、glob から自動で消える。パスを文字列で持たない

## alt (SC 1.1.1)

- 写真には必ず alt を書く。何が写っているかを一文で（「壇上のスクリーンに映ったスライド」）。「写真1」「画像」やファイル名は alt ではない
- alt は写真のパスをキーにした型付きの対応表に置き、`photos/` の全ファイルに alt があることをテストで確かめる（写真を足して alt を忘れたら落ちる）
- 同じ写真を WebGPU の canvas にも描くときは、canvas を `aria-hidden="true"` にし、alt 付きの `<Picture>` の一覧を残す（`motion.md` の「WebGPU が無いとき」と同じ一覧）

## Related

- `motion.md` — ギャラリーの動き・止める手段・WebGPU が無いときの表示
- `accessibility.md` — SC 1.1.1
