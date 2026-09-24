# 07 Dynamic Routes — 実装手順

教材: `06_route_handler.pdf` / `07_dynamic_routes.pdf`  
参考実装: `next-salon-06` / `next-salon-07`  
作業対象: `next-salon`

この章では、6章で作った一覧 API の延長として、店舗詳細（`/shop/[id]`）を Dynamic Routes で実装します。

| パス         | 内容                      |
| ------------ | ------------------------- |
| `/shop`      | 店舗一覧（6章で作成済み） |
| `/shop/[id]` | 店舗詳細（例: `/shop/1`） |

`ShopCard` からはすでに `/shop/${shop.id}` へのリンクがあるため、詳細ページ側で `id` を受け取って表示します。

---

## 06 → 07 で見る API の全体像

### なぜ API をはさむのか（06の前提）

それまでは `page.tsx` が `MOCK_SHOPS` を直接 import していました。データ源を変えると全ページを直す必要があります。

```
[Before]  page.tsx ──import──▶ MOCK_SHOPS
[After]   page.tsx ──Service──▶ /api/shops ──▶ MOCK_SHOPS（将来はDB）
```

フロントは「URLを叩けばJSONが返る」だけ知っていればよく、中身をモック→DBに差し替えてもページ側はほぼ変わりません。

### 共通の3層構造

06も07も、データの流れは同じ3層です。

```
画面 (page)  →  Service (fetchの共通化)  →  Route Handler (JSONの出口)  →  データ源
```

| 層            | 06で作る（一覧）                        | 07で足す（詳細）                               |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| Route Handler | `app/api/shops/route.ts` → `/api/shops` | `app/api/shops/[id]/route.ts` → `/api/shops/1` |
| レスポンス    | `{ shops: Shop[] }`                     | `{ shop: Shop }`                               |
| ShopService   | `getShops()`                            | `getShop(id)`                                  |
| 画面          | `/` , `/shop`                           | `/shop/[id]` + `notFound()`                    |

### 06の流れ（一覧）

```
page.tsx / shop/page.tsx
    │  await getShops()
    ▼
ShopService (lib/services/shops.ts)
    │  fetch(`${BASE_URL}/api/shops`)
    ▼
Route Handler (app/api/shops/route.ts)
    │  MOCK_SHOPS を読む
    ▼
JSON { shops: Shop[] }
```

### 07の流れ（詳細）

```
app/shop/[id]/page.tsx
    │  await getShop(id)
    ▼
ShopService
    │  fetch(`/api/shops/${id}`)
    ▼
Route Handler [id]
    │  find / なければ 404
    ▼
JSON { shop }  または  404
    │
    ▼
shop が null → notFound()
shop あり   → <ShopHero shop={shop} />
```

### 06との差分（APIで増えるもの）

1. **動的セグメント** `[id]` — URL の可変部分を `await params` で取り出す
2. **404 レスポンス** — 見つからないとき `{ status: 404 }` を返す（一覧には不要だった異常系）
3. `getShop(id)` — Service 側も一覧と対になる関数を追加

あとで DB に差し替えるときも、書き換えるのは主に **Route Handler の中身** だけで、`getShops` / `getShop` を呼ぶページはそのまま使えます。

---

## 事前確認（06まで完了していること）

- [x] `npm run dev` で開発サーバーが起動している
- [x] `app/api/shops/route.ts` があり、`/api/shops` で JSON が返る
- [x] `lib/services/shops.ts` に `getShops()` がある
- [x] `/shop` で店舗一覧が表示される
- [x] 各カードの「詳細を見る」が `/shop/1` などにリンクしている
- [x] `.env.local` に `NEXT_PUBLIC_APP_URL=http://localhost:3000` がある（任意・なければコード内のデフォルトで可）

---

## Step 1. 店舗詳細 API（Route Handler）

6章の `app/api/shops/route.ts`（一覧）に対し、**同じ階層に** `[id]` **フォルダ**を足して1件取得 API を作ります。

### 1-1. ファイル作成

`app/api/shops/[id]/route.ts` を作成（または空ファイルなら中身を記述）します。

| ファイル                            | エンドポイント |
| ----------------------------------- | -------------- |
| `app/api/shops/route.ts`（06）      | `/api/shops`   |
| `app/api/shops/[id]/route.ts`（07） | `/api/shops/1` |

フォルダ名 `[id]` が Dynamic Routes のポイントです。

### 1-2. 実装

```ts
import { NextResponse } from "next/server";
import { MOCK_SHOPS } from "@/data/MockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const shop = MOCK_SHOPS.find((s) => s.id === id);

  if (!shop) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ shop });
}
```

### 06の一覧 API との比較

```ts
// 06: 一覧 — params なし、常に 200
export async function GET() {
  return NextResponse.json({ shops: MOCK_SHOPS });
}

// 07: 詳細 — params あり、見つからなければ 404
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  // ...
}
```

### ポイント

- Route Handler でも `params` は **Promise** として渡される（page と同じ）
- 見つからない場合は **404** を返す（API の異常系）
- レスポンス形は一覧が `{ shops }`、詳細が `{ shop }`（単数）

### 動作確認

- `http://localhost:3000/api/shops` → 一覧（06）
- `http://localhost:3000/api/shops/1` → `{ "shop": { ... } }`
- `http://localhost:3000/api/shops/999` → `{ "error": "not found" }`（ステータス 404）

---

## Step 2. ShopService に `getShop` を追加

6章で作った `getShops()` の隣に、対になる `getShop(id)` を足します。

### 2-1. 編集ファイル

`lib/services/shops.ts`

### 2-2. 追加する関数

既存の `getShops` の下に追加します。

```ts
export async function getShop(id: string): Promise<Shop | null> {
  const res = await fetch(`${BASE_URL}/api/shops/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;

  const data: { shop: Shop } = await res.json();
  return data.shop;
}
```

### 対応関係

|        | 06                | 07                 |
| ------ | ----------------- | ------------------ |
| 関数   | `getShops()`      | `getShop(id)`      |
| URL    | `/api/shops`      | `/api/shops/${id}` |
| 戻り値 | `Promise<Shop[]>` | `Promise<Shop      |
| 404時  | （想定しない）    | `null` を返す      |

### ポイント

| 分岐                 | 意味                                                        |
| -------------------- | ----------------------------------------------------------- |
| `res.status === 404` | Route Handler が「見つからない」と返した場合、`null` を返す |
| それ以外             | `{ shop }` から店舗データを返す                             |

ページ側は Route Handler の詳細を意識せず、`getShop(id)` を呼ぶだけで済みます。

> **型のパスについて**  
> `next-salon` では `@/types/shops`、参考教材では `@/types/shop` です。プロジェクト側の import に合わせてください。

---

## Step 3. 店舗詳細ページ（最小実装）

### 3-1. ファイル作成

`app/shop/[id]/page.tsx` を新規作成します。

画面側も API と同じく `[id]` フォルダで可変 URL になります。

| ファイル                       | URL       |
| ------------------------------ | --------- |
| `app/shop/page.tsx`（06）      | `/shop`   |
| `app/shop/[id]/page.tsx`（07） | `/shop/1` |

### 3-2. params の型定義

```ts
type Props = {
  params: Promise<{ id: string }>;
};
```

Next.js 15 では動的ルートの `params` は Promise です。`await` して取り出します。

### 3-3. 最小のページ実装

まず店舗名だけ表示して動作を確認します。

```tsx
import { getShop } from "@/lib/services/shops";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);

  return (
    <div>
      <h1 className="text-2xl font-bold">{shop?.name}</h1>
    </div>
  );
}
```

6章の一覧ページが `await getShops()` だったのに対し、詳細は `await getShop(id)` です。パターンは同じです。

### `?.`（オプショナルチェーン）

```tsx
{
  shop?.name;
}
```

- `shop` にデータがあれば `name` を取得
- `shop` が `null` / `undefined` ならエラーにせず `undefined` にする

### 動作確認

- `/shop/1` → 店舗名が表示される
- `/shop` の「詳細を見る」から遷移できる

---

## Step 4. 404 処理（`notFound`）

API が 404 を返し、Service が `null` を返したとき、画面側では `notFound()` で 404 ページを出します。

```tsx
import { notFound } from "next/navigation";
import { getShop } from "@/lib/services/shops";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{shop.name}</h1>
    </div>
  );
}
```

### 404 の役割分担

| 層            | 404 の扱い                       |
| ------------- | -------------------------------- |
| Route Handler | JSON `{ error }` + `status: 404` |
| ShopService   | `null` に変換                    |
| page.tsx      | `notFound()` で 404 UI           |

### ポイント

- `notFound()` を呼ぶとその場で処理が中断される
- `app/not-found.tsx` がなければ Next.js 標準の 404 UI が表示される
- `if (!shop) { notFound() }` のあと、TypeScript 上は `shop` が必ず存在する型に絞り込まれる（`shop?.name` → `shop.name` でよい）

### 動作確認

- `/shop/1` → 店舗名
- `/shop/999` → 404 ページ

---

## Step 5. ShopHero コンポーネント

ヒーロー部分は JSX が長くなるため、専用コンポーネントに分けます。

### 5-1. ファイル作成

`components/ShopHero.tsx` を作成します。

（PDF では `components/shop/ShopHero.tsx` ですが、本プロジェクトは `ShopCard` などと同様に `components/` 直下で問題ありません。参考教材 `next-salon-07` も直下配置です。）

### 5-2. グリッドレイアウト

ヒーローは「画像 + 情報パネル」の 2 カラムです。

```tsx
<div className="grid lg:grid-cols-[1.15fr_0.85fr]">
  <div>{/* 画像エリア */}</div>
  <div>{/* 情報パネル */}</div>
</div>
```

`fr` は fraction（割合）の単位です。

| 項目 | 指定     | おおよそ |
| ---- | -------- | -------- |
| 左   | `1.15fr` | 57.5%    |
| 右   | `0.85fr` | 42.5%    |

### 5-3. 実装例（参考教材ベース）

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Shop } from "@/types/shops";

export default function ShopHero({ shop }: { shop: Shop }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm mb-6">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        {/* 左: 画像 + 店名オーバーレイ */}
        <div className="relative min-h-96">
          <Image
            src={shop.coverImage}
            alt={shop.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
              {shop.area}
            </div>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
              {shop.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
              {shop.description}
            </p>
          </div>
        </div>

        {/* 右: 店舗情報 + 予約リンク */}
        <div className="bg-slate-950 px-8 py-10 text-white">
          <h3 className="text-sm font-medium tracking-[0.3em] text-rose-200 uppercase">
            Visit
          </h3>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-xs text-white/55">Address</h3>
              <p className="my-2 text-sm text-white/80">{shop.address}</p>
            </div>
            <div>
              <h3 className="text-xs text-white/55">Phone</h3>
              <p className="my-2 text-sm text-white/80">{shop.phone}</p>
            </div>
            <div>
              <h3 className="text-xs text-white/55">Business Hours</h3>
              <div className="my-2 text-sm text-white/80">
                {shop.businessHours.map((hours) => (
                  <p key={hours}>{hours}</p>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <h3 className="text-sm text-white/70">Review score</h3>
              <p className="mt-2 text-4xl font-semibold">{shop.rating}</p>
              <p className="text-sm text-white/70">
                {shop.reviewCount} reviews
              </p>
            </div>
            <Link
              href={`/shop/${shop.id}/book`}
              className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-4 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              この店舗で予約する
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### ポイント

- クリックイベントや `useState` を使わないため `"use client"` **は不要**（Server Component のまま）
- `next/image` / `next/link` はそのまま使える
- 予約リンク `/shop/[id]/book` は次章以降の準備（今はリンク先がなくてもよい）

---

## Step 6. 詳細ページから ShopHero を呼び出す

`app/shop/[id]/page.tsx` を更新します。

```tsx
import { notFound } from "next/navigation";
import { getShop } from "@/lib/services/shops";
import ShopHero from "@/components/ShopHero";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) {
    notFound();
  }

  return (
    <div>
      <ShopHero shop={shop} />
    </div>
  );
}
```

---

## Step 7. 最終動作確認

| URL                     | 期待結果                 | 章  |
| ----------------------- | ------------------------ | --- |
| `/api/shops`            | `{ "shops": [...] }`     | 06  |
| `/api/shops/1`          | `{ "shop": { ... } }`    | 07  |
| `/api/shops/999`        | 404 JSON                 | 07  |
| `/shop`                 | 店舗一覧                 | 06  |
| `/shop/1`               | 店舗詳細（ヒーロー）     | 07  |
| `/shop/2`               | 別店舗の詳細             | 07  |
| `/shop` →「詳細を見る」 | 対応する詳細ページへ遷移 | 07  |
| `/shop/999`             | 404 ページ               | 07  |

---

## 作成・変更したファイル一覧

| ファイル                              | 内容            | 章       |
| ------------------------------------- | --------------- | -------- |
| `app/api/shops/route.ts`              | 店舗一覧 API    | 06（済） |
| `lib/services/shops.ts` の `getShops` | 一覧取得        | 06（済） |
| `app/api/shops/[id]/route.ts`         | 店舗1件取得 API | 07       |
| `lib/services/shops.ts` の `getShop`  | 1件取得（追加） | 07       |
| `app/shop/[id]/page.tsx`              | 店舗詳細ページ  | 07       |
| `components/ShopHero.tsx`             | ヒーロー UI     | 07       |

---

## まとめ（確認用）

| テーマ               | ポイント                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| 3層構造              | 画面 → Service → Route Handler → データ源（06/07共通）                    |
| 06 → 07              | 一覧の隣に「1件取得」を同じ型で足す                                       |
| 動的ルーティング     | `[id]` フォルダで可変 URL セグメントを表現（page / API 両方）             |
| `params`             | Next.js 15 では Promise。`await` して取り出す                             |
| API の 404           | Route Handler が `status: 404` → Service が `null` → page が `notFound()` |
| ShopService の再利用 | 一覧は `getShops`、詳細は `getShop`。ページは API 詳細を意識しない        |
| データ源の差し替え   | 主に Route Handler だけ直せばよい                                         |
| `grid-cols-[...]`    | Tailwind で任意比率の 2 カラムレイアウト                                  |
| ShopHero             | Props で `shop` を受け取る Server Component                               |

---

## つまずきやすい点

1. `params` **を** `await` **し忘れる** → `id` が取れない / 型エラー
2. **フォルダ名を** `id` **にしてしまう** → 必ず `[id]`（角括弧付き）
3. **API だけ作って** `getShop` **を忘れる** → ページから直接 `MOCK_SHOPS` を触らず、Service 経由にする
4. `shop` **が null のまま** `shop.name` **を使う** → 先に `notFound()` でガードする
5. **一覧と詳細のレスポンス形を混ぜる** → `{ shops }`（複数）と `{ shop }`（単数）を取り違えない

以上で第7章（Dynamic Routes）の実装は完了です。
