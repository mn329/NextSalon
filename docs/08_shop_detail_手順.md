# 08 店舗詳細ページ — 実装手順

教材: `08_shop_detail.pdf`  
作業対象: `next-salon`

この章では、7章で作った店舗詳細（`/shop/[id]`）に **メニュー一覧** と **スタッフ一覧** を追加します。

| パス         | 内容（08で追加するもの）   |
| ------------ | -------------------------- |
| `/shop/[id]` | 店舗ヒーロー（07で作成済） |
| 同上         | メニュー一覧（新規）       |
| 同上         | スタッフ一覧（新規）       |

データ取得は、これまでと同じ **型 → モック → API → Service → コンポーネント** の流れです。メニューを完成させてから、同じ手順でスタッフを作ります。

---

## 07 → 08 で見る全体像

### 共通の3層構造（変わらない）

```
画面 (page)  →  Service (fetchの共通化)  →  Route Handler (JSONの出口)  →  データ源
```

07は「店舗1件」、08は「その店舗に紐づくメニュー / スタッフ」を同じ型で足します。

| 層             | 07（店舗）                    | 08（メニュー）                      | 08（スタッフ）                       |
| -------------- | ----------------------------- | ----------------------------------- | ------------------------------------ |
| Route Handler  | `app/api/shops/[id]/route.ts` | `app/api/shops/[id]/menus/route.ts` | `app/api/shops/[id]/staffs/route.ts` |
| エンドポイント | `/api/shops/1`                | `/api/shops/1/menus`                | `/api/shops/1/staffs`                |
| レスポンス     | `{ shop }`                    | `{ menus }`                         | `{ staffs }`                         |
| ShopService    | `getShop(id)`                 | `getMenus(shopId)`                  | `getStaffs(shopId)`                  |
| 画面           | `ShopHero`                    | `ShopMenuList`                      | `ShopStaffList`                      |

### 08のデータフロー

```
app/shop/[id]/page.tsx
    │  await getShop(id)  → なければ notFound()
    │  Promise.all([ getMenus(id), getStaffs(id) ])
    ▼
ShopService
    │  fetch(`/api/shops/${id}/menus`)  → 404 なら []
    │  fetch(`/api/shops/${id}/staffs`) → 404 なら []
    ▼
Route Handler（menus / staffs）
    │  MOCK_*[id] があれば 200 / 無ければ 404
    ▼
JSON { menus } / { staffs }  または  404
    │
    ▼
<ShopHero /> + <ShopMenuList /> + <ShopStaffList />
```

### 07との差分

1. **ネストした API** — `/api/shops/[id]/menus` のように、店舗IDの下に関連リソースを置く
2. `Record<string, T[]>` — 店舗IDをキーに配列を持つモック
3. `Promise.all` — 互いに依存しない非同期処理を並列取得
4. **404 の扱い（本手順の方針）** — キーが無いときは API が **404** を返す（07の `getShop` と同じ）。Service は空配列に変換し、コンポーネント側で「準備中」を出す

> **教材 PDF との違い**  
> PDF は `MOCK_SHOP_MENUS[id] ?? []` で常に 200 + 空配列です。本手順では **404 あり** で進めます（すでに `menus` API が 404 実装なら、そのまま続けてよい）。

---

## 事前確認（07まで完了していること）

- [x] `npm run dev` で開発サーバーが起動している
- [x] `/api/shops/1` で店舗1件の JSON が返る
- [x] `lib/services/shops.ts` に `getShop(id)` がある
- [x] `/shop/1` で `ShopHero` が表示される
- [x] `/shop/999` で 404 になる
- [x] `components/SectionHeading.tsx` がある（メニュー / スタッフ見出しで使う）

---

## Part A. メニュー一覧

メニューを先に完成させ、`/shop/1` で表示できるところまで進めます。

---

## Step 1. Menu 型の定義

### 1-1. ファイル作成

`types/menu.ts` を新規作成します。

```ts
export type Menu = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
};
```

| プロパティ        | 型     | 内容           |
| ----------------- | ------ | -------------- |
| `id`              | string | メニューID     |
| `name`            | string | メニュー名     |
| `description`     | string | 説明           |
| `price`           | number | 価格（円）     |
| `durationMinutes` | number | 所要時間（分） |

Shop 型とは別ファイルにします。責務の違うデータを混ぜないためです。

---

## Step 2. メニューのモックデータ

### 2-1. 編集ファイル

`data/MockData.ts`

### 2-2. 追加内容

既存の `import` がある場合は重複させず統合します。

```ts
import type { Menu } from "@/types/menu";

export const MOCK_SHOP_MENUS: Record<string, Menu[]> = {
  "1": [
    {
      id: "11",
      name: "カット",
      description: "骨格と毛流れに合わせたデザインカット。",
      price: 6600,
      durationMinutes: 60,
    },
  ],
};
```

（プロジェクト側ですでに店舗2・3のメニューがある場合は、そのデータをそのまま使って問題ありません。）

### `Record<string, Menu[]>` とは

店舗IDをキーとして、メニュー配列を管理する型です。

```ts
const menus = MOCK_SHOP_MENUS["1"]; // Menu[] | undefined
```

- 店舗ごとにメニューが違うため、単純な配列ではなく **マップ** にする
- キーが無いときは `undefined` → API 側で **404** を返す

---

## Step 3. メニュー取得 API（Route Handler）

### 3-1. ファイル作成

`app/api/shops/[id]/menus/route.ts`

| ファイル                            | エンドポイント       |
| ----------------------------------- | -------------------- |
| `app/api/shops/[id]/route.ts`（07） | `/api/shops/1`       |
| `app/api/shops/[id]/menus/route.ts` | `/api/shops/1/menus` |

`[id]` の下に `menus` フォルダを足すイメージです。

### 3-2. 実装（404 あり）

07の店舗詳細 API と同じパターンです。

```ts
import { NextResponse } from "next/server";
import { MOCK_SHOP_MENUS } from "@/data/MockData";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const menus = MOCK_SHOP_MENUS[id];

  if (!menus) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ menus });
}
```

### ポイント

- `params` は Promise → `await params` で `id` を取り出す（07と同じ）
- キーが無いときは **404**（空配列を返さない）
- レスポンス形は成功時 `{ menus: Menu[] }`、失敗時 `{ error: "not found" }`

### 07の店舗 API との比較

```ts
// 07: 店舗1件
const shop = MOCK_SHOPS.find((s) => s.id === id);
if (!shop) return NextResponse.json({ error: "not found" }, { status: 404 });

// 08: メニュー一覧
const menus = MOCK_SHOP_MENUS[id];
if (!menus) return NextResponse.json({ error: "not found" }, { status: 404 });
```

### 動作確認

- `http://localhost:3000/api/shops/1/menus` → `{ "menus": [ ... ] }`（200）
- `http://localhost:3000/api/shops/999/menus` → `{ "error": "not found" }`（404）

---

## Step 4. ShopService に `getMenus` を追加

### 4-1. 編集ファイル

`lib/services/shops.ts`

### 4-2. 追加する関数

`BASE_URL` は既存の定義を使います。404 は `getShop` と同様に扱い、ページには空配列を返して「準備中」表示に回します。

```ts
import type { Menu } from "@/types/menu";

export async function getMenus(shopId: string): Promise<Menu[]> {
  const res = await fetch(`${BASE_URL}/api/shops/${shopId}/menus`, {
    cache: "no-store",
  });

  // API が 404 → 空配列（コンポーネント側で「準備中」）
  if (res.status === 404) return [];

  if (!res.ok) throw new Error("メニューの取得に失敗しました");

  const data: { menus: Menu[] } = await res.json();
  return data.menus;
}
```

### 404 の役割分担（メニュー）

| 層             | 404 の扱い                              |
| -------------- | --------------------------------------- |
| Route Handler  | JSON `{ error }` + `status: 404`        |
| ShopService    | `[]` に変換                             |
| コンポーネント | `menus.length === 0` で「準備中」を表示 |

> `getShop` **との違い**  
> 店舗が無い → ページ全体を `notFound()` にしたいので Service は `null`。  
> メニューが無い → ページは出したいので Service は `[]` にして部分的に「準備中」を出す。

### 対応関係

|            | 07                 | 08（メニュー）               |
| ---------- | ------------------ | ---------------------------- | -------- |
| 関数       | `getShop(id)`      | `getMenus(shopId)`           |
| URL        | `/api/shops/${id}` | `/api/shops/${shopId}/menus` |
| 戻り値     | `Shop              | null`                        | `Menu[]` |
| 404時      | `null`             | `[]`                         |
| その他失敗 | （想定しにくい）   | `throw`（`!res.ok`）         |

ページ側は API の URL や `fetch` を直接書かず、`getMenus()` だけ呼びます。

---

## Step 5. ShopMenuList コンポーネント

### 5-1. ファイル作成

`components/ShopMenuList.tsx` を作成します。

（PDF では `components/shop/ShopMenuList.tsx` ですが、本プロジェクトは `ShopHero` / `ShopCard` と同様に `components/` 直下で問題ありません。import パスを揃えればどちらでも可。）

### 5-2. 実装

```tsx
import SectionHeading from "@/components/SectionHeading";
import type { Menu } from "@/types/menu";

export default function ShopMenuList({ menus }: { menus: Menu[] }) {
  if (menus.length === 0) {
    return <p className="text-sm text-slate-500">メニューは準備中です。</p>;
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Menus"
        title="メニュー"
        description="メニューの価格と所要時間を確認できます。"
      />
      <div className="flex flex-col gap-4">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="flex items-start justify-between gap-6 rounded-2xl border border-slate-200 p-5"
          >
            <div>
              <p className="font-medium text-slate-950">{menu.name}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {menu.description}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold text-slate-950">
                ¥{menu.price.toLocaleString("ja-JP")}
              </p>
              <p className="text-xs text-slate-500">
                {menu.durationMinutes} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### ポイント

- `"use client"` は不要（Server Component のまま）
- 空配列 → 「準備中」メッセージ
- `toLocaleString("ja-JP")` で `6600` → `6,600` のように表示

---

## Step 6. 詳細ページにメニューを組み込む（途中段階）

この段階ではメニューだけ表示します。スタッフはまだ入れません。

### 6-1. 編集ファイル

`app/shop/[id]/page.tsx`

### 6-2. 実装

```tsx
import { notFound } from "next/navigation";
import { getShop, getMenus } from "@/lib/services/shops";
import ShopHero from "@/components/ShopHero";
import ShopMenuList from "@/components/ShopMenuList";

type Props = { params: Promise<{ id: string }> };

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) notFound();

  const menus = await getMenus(id);

  return (
    <div>
      <ShopHero shop={shop} />
      <section className="mt-12">
        <ShopMenuList menus={menus} />
      </section>
    </div>
  );
}
```

> **import パス**  
> `ShopHero` の場所に合わせてください。本プロジェクトは `@/components/ShopHero`、PDF は `@/components/shop/ShopHero` です。

### 動作確認

- `/shop/1` → ヒーローの下にメニュー一覧が表示される
- `/api/shops/1/menus` → JSON が正しい

ここまでできたら Part A（メニュー）は完了です。

---

## Part B. スタッフ一覧

メニューと同じ「型 → データ → API → Service → コンポーネント」の順番で作ります。

---

## Step 7. Staff 型の定義

### 7-1. ファイル作成

`types/staff.ts`

```ts
export type Staff = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl: string;
};
```

| プロパティ  | 型     | 内容       |
| ----------- | ------ | ---------- |
| `id`        | string | スタッフID |
| `name`      | string | 名前       |
| `specialty` | string | 得意分野   |
| `bio`       | string | 自己紹介   |
| `imageUrl`  | string | 画像URL    |

---

## Step 8. スタッフのモックデータ

### 8-1. 編集ファイル

`data/MockData.ts`

```ts
import type { Staff } from "@/types/staff";

export const MOCK_SHOP_STAFF: Record<string, Staff[]> = {
  "1": [
    {
      id: "101",
      name: "Mio",
      specialty: "柔らかなボブと顔まわりレイヤー",
      bio: "生活に馴染む質感づくりが得意です。",
      imageUrl: "/images/staff-mio.avif",
    },
  ],
};
```

画像は `public/images/` 配下を想定しています。ファイルが無い場合は、既存の画像パスに合わせるか、プレースホルダ画像を用意してください。

---

## Step 9. スタッフ取得 API（Route Handler）

### 9-1. ファイル作成

`app/api/shops/[id]/staffs/route.ts`（メニューと同じく **404 あり**）

```ts
import { NextResponse } from "next/server";
import { MOCK_SHOP_STAFF } from "@/data/MockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const staffs = MOCK_SHOP_STAFF[id];

  if (!staffs) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ staffs });
}
```

### 動作確認

- `http://localhost:3000/api/shops/1/staffs` → `{ "staffs": [ ... ] }`（200）
- `http://localhost:3000/api/shops/999/staffs` → `{ "error": "not found" }`（404）

---

## Step 10. ShopService に `getStaffs` を追加

`lib/services/shops.ts` に追加します。メニューの `getMenus` と同じ 404 処理です。

```ts
import type { Staff } from "@/types/staff";

export async function getStaffs(shopId: string): Promise<Staff[]> {
  const res = await fetch(`${BASE_URL}/api/shops/${shopId}/staffs`, {
    cache: "no-store",
  });

  if (res.status === 404) return [];

  if (!res.ok) throw new Error("スタッフの取得に失敗しました");

  const data: { staffs: Staff[] } = await res.json();
  return data.staffs;
}
```

---

## Step 11. ShopStaffList コンポーネント

### 11-1. ファイル作成

`components/ShopStaffList.tsx`

```tsx
import Image from "next/image";
import type { Staff } from "@/types/staff";
import SectionHeading from "@/components/SectionHeading";

export default function ShopStaffList({ staffs }: { staffs: Staff[] }) {
  if (staffs.length === 0) {
    return <p className="text-sm text-slate-500">スタッフ情報は準備中です。</p>;
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Staff"
        title="スタッフ紹介"
        description="スタッフの得意分野を確認できます。"
      />
      <div className="flex flex-col gap-4">
        {staffs.map((staff) => (
          <div
            key={staff.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Image
                src={staff.imageUrl}
                alt={staff.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-slate-950">{staff.name}</p>
              <p className="mt-1 text-sm text-rose-600">{staff.specialty}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {staff.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### ポイント

- `next/image` の `fill` は親に `relative` とサイズ指定が必要
- 丸いサムネは `rounded-full` + `overflow-hidden`
- `"use client"` は不要

---

## Step 12. 詳細ページにメニュー＋スタッフを組み込む（最終形）

`app/shop/[id]/page.tsx` を最終形に更新します。

```tsx
import { notFound } from "next/navigation";
import { getShop, getMenus, getStaffs } from "@/lib/services/shops";
import ShopHero from "@/components/ShopHero";
import ShopMenuList from "@/components/ShopMenuList";
import ShopStaffList from "@/components/ShopStaffList";

type Props = { params: Promise<{ id: string }> };

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) notFound();

  // 互いに依存しないデータを並列取得
  const [menus, staffs] = await Promise.all([getMenus(id), getStaffs(id)]);

  return (
    <div>
      <ShopHero shop={shop} />
      <section className="mt-12 grid gap-12 lg:grid-cols-2">
        <ShopMenuList menus={menus} />
        <ShopStaffList staffs={staffs} />
      </section>
    </div>
  );
}
```

### `Promise.all` で並列取得する理由

`getMenus(id)` と `getStaffs(id)` は互いの結果に依存しないため、並列に実行できます。

| 書き方               | 待ち時間の目安           |
| -------------------- | ------------------------ |
| `await` を順番に実行 | 2つの通信時間の **合計** |
| `Promise.all`        | 遅い方の通信時間程度     |

```ts
// ❌ 直列（遅い）
const menus = await getMenus(id);
const staffs = await getStaffs(id);

// ✅ 並列（速い）
const [menus, staffs] = await Promise.all([getMenus(id), getStaffs(id)]);
```

### なぜ `shop` だけ先に取るか

- 店舗が無いときは `notFound()` したい
- メニュー / スタッフは店舗が存在する前提で取る
- どちらか一方が失敗すると `Promise.all` 全体が失敗する点にも注意

### レイアウト

`lg:grid-cols-2` で、大きい画面ではメニューとスタッフを2列、狭い画面では縦並びにします。

---

## Step 13. 最終動作確認

| URL                     | 期待結果                                         |
| ----------------------- | ------------------------------------------------ |
| `/api/shops/1/menus`    | `{ "menus": [...] }`（200）                      |
| `/api/shops/1/staffs`   | `{ "staffs": [...] }`（200）                     |
| `/api/shops/999/menus`  | `{ "error": "not found" }`（404）                |
| `/api/shops/999/staffs` | `{ "error": "not found" }`（404）                |
| `/shop/1`               | ヒーロー + メニュー + スタッフ                   |
| `/shop/2`               | 別店舗のメニュー / スタッフ                      |
| `/shop/999`             | 404 ページ（店舗が無いため。menus までは来ない） |

---

## 作成・変更したファイル一覧

| ファイル                               | 役割                        | 新規 / 編集 |
| -------------------------------------- | --------------------------- | ----------- |
| `types/menu.ts`                        | Menu 型                     | 新規        |
| `types/staff.ts`                       | Staff 型                    | 新規        |
| `data/MockData.ts`                     | メニュー / スタッフのモック | 編集        |
| `app/api/shops/[id]/menus/route.ts`    | メニュー取得 API（404あり） | 新規        |
| `app/api/shops/[id]/staffs/route.ts`   | スタッフ取得 API（404あり） | 新規        |
| `lib/services/shops.ts` の `getMenus`  | メニュー取得（404→`[]`）    | 編集        |
| `lib/services/shops.ts` の `getStaffs` | スタッフ取得（404→`[]`）    | 編集        |
| `components/ShopMenuList.tsx`          | メニュー表示                | 新規        |
| `components/ShopStaffList.tsx`         | スタッフ表示                | 新規        |
| `app/shop/[id]/page.tsx`               | 詳細ページ組み込み          | 編集        |

---

## まとめ（確認用）

| テーマ             | ポイント                                             |
| ------------------ | ---------------------------------------------------- |
| 型定義             | Menu と Staff を別々に定義                           |
| モックデータ       | 店舗IDをキーに配列を管理（`Record<string, T[]>`）    |
| Route Handler      | `[id]` の下に `menus` / `staffs`。無いときは **404** |
| Service            | 404 → `[]`、それ以外の失敗 → `throw`                 |
| コンポーネント     | 空配列なら「準備中」、それ以外は一覧表示             |
| `Promise.all`      | 独立した非同期処理を並列実行                         |
| 店舗 vs 関連データ | 店舗なし → `notFound()` / メニューなし → 「準備中」  |
| `lg:grid-cols-2`   | 大きい画面で2列に表示                                |

---

## つまずきやすい点

1. **メニューだけ作ってページに組み込まずにスタッフへ進む** → まず Part A で `/shop/1` にメニューが出ることを確認する
2. `params` **を** `await` **し忘れる** → menus / staffs の API でも Promise
3. **ページから直接** `fetch` **や** `MOCK_`\* **を触る** → 必ず Service（`getMenus` / `getStaffs`）経由にする
4. `Promise.all` **の前に** `getShop` **のガードを忘れる** → 店舗が無いときは先に `notFound()`
5. **API は 404 なのに Service で** `!res.ok` **だけ見て throw する** → `res.status === 404` を先に分岐しないと、ページがエラーになる
6. **直列** `await` **のままにする** → 依存が無ければ `Promise.all` を使う
7. **コンポーネントの配置パスを PDF と混ぜる** → `components/` 直下か `components/shop/` か、プロジェクトに合わせて統一する
8. **スタッフ画像が 404** → `public/images/` にファイルがあるか、`imageUrl` のパスを確認する（API の 404 とは別問題）
9. **staffs の route.ts を** `app/shop/` **下に置いてしまう** → 正しくは `app/api/shops/[id]/staffs/route.ts`。間違うと「準備中」だけ出る

---

## 補足: 何を import し、何を変数にするか

コードは読めるけど「自分で書くとき、何を import / 変数にするか分からない」ときの判断ガイドです。感覚ではなく **役割で決める** と迷いにくいです。

### まず覚える「3つの置き場所」

| 置き場所           | 役割           | 例                             |
| ------------------ | -------------- | ------------------------------ |
| `types/`           | データの形     | `Menu`, `Staff`                |
| `lib/services/`    | データを取る   | `getMenus`, `getStaffs`        |
| `components/`      | 画面に出す     | `ShopMenuList`, `ShopStaffList` |

ページ（`page.tsx`）はだいたいこの3つを組み合わせるだけです。

### 判断の順番（これだけ覚える）

画面を作るとき、自分にこう聞く。

1. **何を表示したい？** → コンポーネントを import
2. **そのデータはどこから来る？** → Service を import
3. **型は必要？** → 自分で組み立てるときだけ `type` を import

例: 店舗詳細にスタッフを出したい

```
表示したい → ShopStaffList
データ元   → getStaffs
型         → Staff（コンポーネント側で使う。ページでは必須ではない）
```

だからページの import はこうなる。

```tsx
import { getShop, getMenus, getStaffs } from "@/lib/services/shops"; // データ取得
import ShopHero from "@/components/ShopHero";                       // 表示
import ShopMenuList from "@/components/ShopMenuList";               // 表示
import ShopStaffList from "@/components/ShopStaffList";             // 表示
```

### 変数に入れるルール

**「あとで使う値」だけ変数にする。**

| こう聞かれたら           | 変数にする                                      |
| ------------------------ | ----------------------------------------------- |
| URL から取り出す？       | `const { id } = await params`                   |
| API / Service の結果？   | `const shop = await getShop(id)`                |
| 複数まとめて取る？       | `const [menus, staffs] = await Promise.all(...)` |
| JSX に1回しか出さない？  | 変数にしなくてよいこともある                    |

```tsx
const { id } = await params; // URL の番号
const shop = await getShop(id); // 店舗
const [menus, staffs] = await Promise.all([
  getMenus(id),
  getStaffs(id),
]); // メニューとスタッフ
```

そのあと、変数をコンポーネントに渡すだけ。

```tsx
<ShopHero shop={shop} />
<ShopMenuList menus={menus} />
<ShopStaffList staffs={staffs} />
```

### ファイルの種類ごとの「だいたい決まった import」

#### `page.tsx`（画面の司令塔）

- Service（`getXxx`）
- コンポーネント
- 必要なら `notFound` など Next の道具

#### `components/Xxx.tsx`（見た目）

- `type`（props の型）
- 小さい部品（`SectionHeading`, `Image` など）
- **Service は通常 import しない**（データは親から props でもらう）

#### `lib/services/shops.ts`（取得）

- `type`
- `server-only`
- （`fetch` は組み込みなので import 不要）

#### `app/api/.../route.ts`（API）

- `NextResponse`
- `MockData`

### Service の import を詳しく

Service（`lib/services/shops.ts`）は **「データを取る窓口」** です。ページは API の URL を直接書かず、ここから関数を import します。

#### ページ側（呼ぶ側）

```tsx
// {} で必要な関数だけ取り出す（名前付き import）
import { getShop, getMenus, getStaffs } from "@/lib/services/shops";
```

| import するもの | 用途                         | 戻り値の目安        |
| --------------- | ---------------------------- | ------------------- |
| `getShop`       | 店舗1件                      | `Shop \| null`      |
| `getMenus`      | その店舗のメニュー一覧       | `Menu[]`            |
| `getStaffs`     | その店舗のスタッフ一覧       | `Staff[]`           |

ポイント:

- ファイルパスは `@/lib/services/shops`（拡張子 `.ts` は書かない）
- `default` ではなく **`{ getShop, getMenus, ... }`**（名前付き export）
- 必要な関数だけ書けばよい（使わないものは import しなくてよい）
- ページでは `Menu` / `Staff` 型を import しなくてよい（Service が型付きで返してくれる）

#### Service 側（中で書く import）

```ts
import "server-only"; // サーバー専用ガード
import type { Shop } from "@/types/shops";
import type { Menu } from "@/types/menu";
import type { Staff } from "@/types/staff";
```

| import                       | なぜ必要か                         |
| ---------------------------- | ---------------------------------- |
| `server-only`                | クライアントから誤って呼ばれないようにする |
| `import type { Menu }` など  | 戻り値の型を付ける（実行時コードには含まれない） |

`fetch` や `BASE_URL` は Service の中だけで使い、**ページには出さない**。

#### 誰が何を import するか（矢印）

```
page.tsx
  │  import { getStaffs } from "@/lib/services/shops"
  │  const staffs = await getStaffs(id)
  │  <ShopStaffList staffs={staffs} />
  ▼
shops.ts（Service）
  │  fetch("/api/shops/1/staffs")   ← URL はここだけが知っている
  ▼
app/api/shops/[id]/staffs/route.ts
  │  import { MOCK_SHOP_STAFF } from "@/data/MockData"
  ▼
JSON { staffs }
```

**コンポーネントは Service を import しない。**  
データは親（page）が取って、props で渡す。

```tsx
// ❌ コンポーネントから直接
import { getStaffs } from "@/lib/services/shops";

// ✅ ページが取って渡す
<ShopStaffList staffs={staffs} />
```

#### API の置き場所と Service の対応（よくあるミス）

Service が叩く URL と、`route.ts` の場所は **必ず対応** させます。

| Service の URL                 | route.ts の正しい場所                    |
| ------------------------------ | ---------------------------------------- |
| `/api/shops`                   | `app/api/shops/route.ts`                 |
| `/api/shops/1`                 | `app/api/shops/[id]/route.ts`            |
| `/api/shops/1/menus`           | `app/api/shops/[id]/menus/route.ts`      |
| `/api/shops/1/staffs`          | `app/api/shops/[id]/staffs/route.ts`     |

```
✅ app/api/shops/[id]/staffs/route.ts  →  /api/shops/1/staffs
❌ app/shop/[id]/staffs/route.ts       →  /shop/1/staffs（ページ用。API ではない）
```

間違った場所に置くと:

1. Service の `fetch("/api/shops/1/staffs")` が 404
2. `getStaffs` が `[]` を返す
3. 画面に「スタッフ情報は準備中です。」と出る

確認方法: ブラウザで `http://localhost:3000/api/shops/1/staffs` を開き、JSON が返るか見る。

誤って `app/shop/[id]/staffs/` を作ってしまった場合は削除する。

### 迷ったときのカンペ

```
表示する部品？     → components から import
データを取る？     → services から import → const に入れる
データの形だけ？   → types から import type
APIの返事を返す？ → NextResponse
モックを読む？     → MockData
API のファイル？   → 必ず app/api/ の下（app/shop/ ではない）
```

「何を import するか」は記憶というより、**今つくっているファイルの役割**で決まります。  
`page.tsx` なら「取る（Service）＋出す（Component）」の2系統だけ意識すれば十分です。

---

以上で第8章（店舗詳細ページ）の実装は完了です。
