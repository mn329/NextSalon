# 09 Client Component と状態管理 — 実装手順

教材: `09_client_component_state.pdf`  
参考実装: `next-salon-09`（※参考は後半章の機能も含む。この章は PDF の範囲で進める）  
作業対象: `next-salon`

この章では、予約ページ（`/shop/[id]/book`）の土台を作ります。  
**データ取得は Server Component**、**ステップ切替などの操作は Client Component** に分けます。

| パス              | 内容                         |
| ----------------- | ---------------------------- |
| `/shop/[id]/book` | 予約ページ（新規）           |
| Context           | 予約フローの状態管理（新規） |
| BookingForm       | 「戻る」「次へ」で STEP 切替 |

各ステップの中身（メニュー選択 UI など）は **10章以降** です。今は STEP 表示とボタン切替まで。

---

## 08 → 09 で見る全体像

### これまでとの違い

| 章  | やること                       | 主な技術                              |
| --- | ------------------------------ | ------------------------------------- |
| 07  | 店舗詳細（表示）               | Dynamic Routes / Server               |
| 08  | メニュー・スタッフ一覧（表示） | API / Service / Server                |
| 09  | 予約フローの **操作・状態**    | `"use client"` / useReducer / Context |

08までは主に「データを取って表示」でした。09は「ボタンを押すと画面の状態が変わる」が中心です。

### 予約ページの構成

```
app/shop/[id]/book/page.tsx          ← Server（データ取得）
  └─ BookingForm.tsx "use client"    ← 境界線
        └─ BookingProvider
              └─ BookingFlow         ← useBooking() で step を読む
```

| ファイル                             | 種類             | 理由                               |
| ------------------------------------ | ---------------- | ---------------------------------- |
| `app/shop/[id]/book/page.tsx`        | Server Component | `await getShop` などでデータ取得   |
| `contexts/BookingContext.tsx`        | Client Component | `useReducer` / `useContext` を使う |
| `components/booking/BookingForm.tsx` | Client Component | クリックで `dispatch` する         |

### なぜ全部 Client にしないか

| 理由             | 内容                                                        |
| ---------------- | ----------------------------------------------------------- |
| 表示が速い       | ブラウザに送る JS が少なくなる                              |
| 安全             | `server-only` の Service や秘密情報をブラウザに送らずに済む |
| データ取得が簡単 | `async/await` のまま取れる（`useEffect` 不要）              |

---

## 事前確認（08まで完了していること）

- [x] `npm run dev` が起動している
- [x] `/shop/1` でヒーロー・メニュー・スタッフが表示される
- [x] `ShopHero` の「この店舗で予約する」が `/shop/1/book` にリンクしている
- [x] `getShop` / `getMenus` / `getStaffs` がある

---

## Part 0. `"use client"` の考え方（実装前に読む）

### Server vs Client

|                    | Server Component           | Client Component                        |
| ------------------ | -------------------------- | --------------------------------------- |
| 書き方             | 何も書かない（デフォルト） | ファイル先頭に `"use client"`           |
| 実行場所           | サーバーのみ               | サーバー（最初の HTML）＋ブラウザ       |
| `async/await` 取得 | できる                     | コンポーネント自体を `async` にできない |
| `useState` など    | 使えない                   | 使える                                  |
| `onClick` など     | 使えない                   | 使える                                  |

よくある誤解: `"use client"` を付けても「ブラウザだけで動く」わけではない。最初の HTML はサーバーで作られ、ブラウザでイベントに反応できるようになる（ハイドレーション）。

### いつ `"use client"` が必要か

| 使うもの            | 例                                       |
| ------------------- | ---------------------------------------- |
| state / フック      | `useState` / `useReducer` / `useContext` |
| イベント            | `onClick` / `onChange`                   |
| ブラウザ専用 API    | `window` / `localStorage`                |
| Context の Provider | `createContext` で配る側                 |

### `"use client"` は境界線

境界の内側で import したコンポーネントは、自分に `"use client"` が無くても Client として動きます。

```
page.tsx（Server）
└─ BookingForm.tsx "use client"  ← 境界線はここ1回で十分
   ├─ MenuStep.tsx      （10章・"use client" なしでも Client）
   └─ BookingSummary.tsx
```

### Server → Client に渡せる Props

| 渡せる                       | 渡せない               |
| ---------------------------- | ---------------------- |
| 文字列・数値・真偽値・`null` | 関数（`onClick` など） |
| 配列・プレーンなオブジェクト | クラスのインスタンス   |

`shop` / `menus` / `staffs` は JSON 由来のプレーンオブジェクトなので渡せます。

---

## Part A. 予約ページ（最小）

### Step 1. ページ作成

`app/shop/[id]/book/page.tsx` を新規作成します。

```tsx
import { notFound } from "next/navigation";
import SectionHeading from "@/components/SectionHeading";
import { getShop } from "@/lib/services/shops";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookingPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) {
    notFound();
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Booking"
        title={`${shop.name} の予約`}
        description="メニュー・スタッフ・日時を選んで予約します。"
      />
    </div>
  );
}
```

店舗情報は操作で変わらないので、Server Component で取得します。

### 動作確認

- `/shop/1` →「この店舗で予約する」→ `/shop/1/book` がエラーなく開く
- 見出しに店舗名が出る

---

## Part B. BookingContext（状態管理）

### useReducer とは

| 要素       | 役割                                                        |
| ---------- | ----------------------------------------------------------- |
| `state`    | 今の状態（`step`, `menuId` など）                           |
| `dispatch` | action を送る関数（例: `dispatch({ type: "next" })`）       |
| `reducer`  | 今の state と action から **次の state** を計算して返す関数 |

予約では管理する値が 6 つあるので、`useState` を 6 個並べるより `useReducer` の方が見通しが良いです。

|              | useState                   | useReducer                          |
| ------------ | -------------------------- | ----------------------------------- |
| 向き         | 独立した値が少ない         | 関連する値が多い・更新が複雑        |
| 更新         | `setValue()` で直接        | `dispatch(action)` → reducer が計算 |
| ロジック場所 | 呼び出し側に散らばりやすい | reducer 1か所にまとまる             |

今回の「関連する値」は予約フォームのひとまとまりです。

| 値        | 意味             |
| --------- | ---------------- |
| `step`    | 今のステップ番号 |
| `menuId`  | 選んだメニュー   |
| `staffId` | 選んだスタッフ   |
| `date`    | 予約日           |
| `time`    | 予約時間         |
| `notes`   | 備考             |

### useReducer の基本構文

#### 1. 呼び出し方

```ts
const [state, dispatch] = useReducer(reducer, initialState);
```

| 部分           | 意味                                      |
| -------------- | ----------------------------------------- |
| `reducer`      | `(今のstate, action) => 次のstate` の関数 |
| `initialState` | 最初の状態                                |
| `state`        | 今の状態（読み取り用）                    |
| `dispatch`     | 更新したいときに action を送る関数        |

`useState` との対応:

```ts
const [value, setValue] = useState(初期値); // 直接セット
const [state, dispatch] = useReducer(reducer, 初期値); // action を送る
```

#### 2. reducer の形

```ts
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "何か":
      return { ...state /* 変えたいところだけ上書き */ };
    default:
      return state;
  }
}
```

ルール:

- **今の state を直接書き換えない**（`state.xxx = ...` 禁止）
- 必ず **新しいオブジェクト** を返す（`{ ...state, xxx: 新しい値 }`）

#### 3. action を送る

```ts
dispatch({ type: "next" });
dispatch({ type: "select-menu", menuId: "11" });
```

`type` で「何をしたいか」を表し、必要な値を一緒に載せます。

#### 4. 最小の完成例（イメージ）

```ts
type State = { count: number };
type Action = { type: "inc" } | { type: "dec" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "dec":
      return { count: state.count - 1 };
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });

dispatch({ type: "inc" }); // state.count が 1 になる
```

#### 5. 今回（予約）での対応

```ts
const [state, dispatch] = useReducer(bookingReducer, INITIAL_STATE);

// 読む
state.step;
state.menuId;

// 更新する
dispatch({ type: "next" });
dispatch({ type: "prev" });
dispatch({ type: "select-menu", menuId: "11" });
```

流れはいつも同じです。

```
dispatch(action)  →  reducer(state, action)  →  新しい state  →  再表示
```

### Context とは

親子をまたいで値を共有する仕組みです。

| 要素            | 役割                 |
| --------------- | -------------------- |
| `createContext` | 入れ物を作る         |
| `Provider`      | 囲んだ範囲に値を配る |
| `useContext`    | 配られた値を取り出す |

この章では `state` と `dispatch` を Context に入れて、`BookingForm` 側から使います。

---

### Step 2. BookingContext を作成

#### 2-0. ファイル作成（パス）

プロジェクト直下に `contexts` フォルダを作り、次のファイルを新規作成します。

| 項目        | 内容                          |
| ----------- | ----------------------------- |
| フォルダ    | `contexts/`（なければ新規）   |
| ファイル    | `contexts/BookingContext.tsx` |
| import パス | `@/contexts/BookingContext`   |

> **スペル注意**  
> `BookingComtext.tsx` ではなく `**BookingContext.tsx**`（Con**t**ext）です。

```
next-salon/
  contexts/
    BookingContext.tsx   ← ここ（新規）
  app/
  components/
  ...
```

ファイル先頭に `"use client"` を書きます。

#### 2-1. 定数と型

```tsx
"use client";

import { createContext, useContext, useReducer } from "react";

export const TOTAL_STEPS = 4;

export type BookingState = {
  step: number;
  menuId: string | null;
  staffId: string | null;
  date: string | null;
  time: string | null;
  notes: string;
};

const INITIAL_STATE: BookingState = {
  step: 1,
  menuId: null,
  staffId: null,
  date: null,
  time: null,
  notes: "",
};
```

| プロパティ | 型                     | 初期値 | 内容                                |
| ---------- | ---------------------- | ------ | ----------------------------------- |
| `step`     | `number`               | `1`    | 現在のステップ                      |
| `menuId`   | `string` または `null` | `null` | 選んだメニュー ID                   |
| `staffId`  | `string` または `null` | `null` | 選んだスタッフ（`null` = 指名なし） |
| `date`     | `string` または `null` | `null` | 予約日（`YYYY-MM-DD`）              |
| `time`     | `string` または `null` | `null` | 予約時間（`HH:MM`）                 |
| `notes`    | `string`               | `""`   | 備考                                |

`TOTAL_STEPS` を定数にする理由: あちこちで `4` を直書きすると、ステップ追加時に直し漏れが起きるため。

#### 2-2. Action（ユニオン型）

```tsx
export type BookingAction =
  | { type: "select-menu"; menuId: string }
  | { type: "select-staff"; staffId: string | null }
  | { type: "select-date"; date: string }
  | { type: "select-time"; time: string }
  | { type: "change-notes"; notes: string }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" };
```

`|` でつないだ型を **ユニオン型** と呼びます。`type` ごとに一緒に送る値が決まります。  
例: `{ type: "select-menu" }` だけだと `menuId` が無く型エラーになります。

| type           | 受け取る値                      | 内容           |
| -------------- | ------------------------------- | -------------- |
| `select-menu`  | `menuId: string`                | メニュー選択   |
| `select-staff` | `staffId: string` または `null` | スタッフ選択   |
| `select-date`  | `date: string`                  | 日付選択       |
| `select-time`  | `time: string`                  | 時間選択       |
| `change-notes` | `notes: string`                 | 備考変更       |
| `next`         | なし                            | 次のステップ   |
| `prev`         | なし                            | 前のステップ   |
| `reset`        | なし                            | 初期状態に戻す |

#### 2-3. reducer

```tsx
function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "select-menu":
      return { ...state, menuId: action.menuId };
    case "select-staff":
      return { ...state, staffId: action.staffId };
    case "select-date":
      return { ...state, date: action.date };
    case "select-time":
      return { ...state, time: action.time };
    case "change-notes":
      return { ...state, notes: action.notes };
    case "next":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case "prev":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "reset":
      return INITIAL_STATE;
  }
}
```

| 書き方                                | 意味                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `{ ...state, menuId: action.menuId }` | コピーして `menuId` だけ上書きした **新しいオブジェクト** を返す |
| `Math.min(..., TOTAL_STEPS)`          | step が 4 を超えない                                             |
| `Math.max(..., 1)`                    | step が 1 未満にならない                                         |

重要: `state.menuId = ...` のように **直接書き換えない**。新しいオブジェクトを返す。

#### 2-4. Provider と useBooking

```tsx
type BookingContextValue = {
  shopId: string;
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({
  shopId,
  children,
}: {
  shopId: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(bookingReducer, INITIAL_STATE);

  return (
    <BookingContext.Provider value={{ shopId, state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking は BookingProvider の内側で使ってください");
  }
  return context;
}
```

`useBooking` で `null` チェックする利点:

1. Provider 囲み忘れにすぐ気づける
2. 戻り値が `null` なしの型になり、使う側のチェックが不要

---

### Step 2 完成形（まとめ）

上記を1ファイルにまとめたものが `contexts/BookingContext.tsx` です。  
実装したらファイル全体を見返し、「型 → 初期値 → action → reducer → Provider → useBooking」の順になっているか確認します。

#### 完成コード（このまま使ってよい）

```tsx
"use client";

import { createContext, useContext, useReducer } from "react";

// 1. 定数
export const TOTAL_STEPS = 4;

// 2. 型（BookingState）
export type BookingState = {
  step: number;
  menuId: string | null;
  staffId: string | null;
  date: string | null;
  time: string | null;
  notes: string;
};

// 3. 初期値
const INITIAL_STATE: BookingState = {
  step: 1,
  menuId: null,
  staffId: null,
  date: null,
  time: null,
  notes: "",
};

// 4. action（ユニオン型）
export type BookingAction =
  | { type: "select-menu"; menuId: string }
  | { type: "select-staff"; staffId: string | null }
  | { type: "select-date"; date: string }
  | { type: "select-time"; time: string }
  | { type: "change-notes"; notes: string }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" };

// 5. reducer
function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "select-menu":
      return { ...state, menuId: action.menuId };
    case "select-staff":
      return { ...state, staffId: action.staffId };
    case "select-date":
      return { ...state, date: action.date };
    case "select-time":
      return { ...state, time: action.time };
    case "change-notes":
      return { ...state, notes: action.notes };
    case "next":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case "prev":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "reset":
      return INITIAL_STATE;
  }
}

// 6. Context の値の型
type BookingContextValue = {
  shopId: string;
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

// 7. Provider（state / dispatch を配る）
export function BookingProvider({
  shopId,
  children,
}: {
  shopId: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(bookingReducer, INITIAL_STATE);

  return (
    <BookingContext.Provider value={{ shopId, state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

// 8. useBooking（配られた値を取り出す）
export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking は BookingProvider の内側で使ってください");
  }
  return context;
}
```

確認チェック:

- [x] ファイルパスは `contexts/BookingContext.tsx`（スペル注意）
- [x] 先頭に `"use client"` がある
- [x] 並びが「定数 → 型 → 初期値 → action → reducer → Provider → useBooking」

---

## Part C. BookingForm

### Step 3. `components/booking/BookingForm.tsx` を作成

```tsx
"use client";

import type { Menu } from "@/types/menu";
import type { Shop } from "@/types/shops";
import type { Staff } from "@/types/staff";
import {
  BookingProvider,
  TOTAL_STEPS,
  useBooking,
} from "@/contexts/BookingContext";

type BookingFormProps = {
  shop: Shop;
  menus: Menu[];
  staffs: Staff[];
};

export default function BookingForm({ shop }: BookingFormProps) {
  // menus / staffs は10章以降で使う。今は受け取るだけでもOK
  return (
    <BookingProvider shopId={shop.id}>
      <BookingFlow />
    </BookingProvider>
  );
}

function BookingFlow() {
  const { state, dispatch } = useBooking();

  return (
    <div>
      {state.step === 1 && <div>STEP 1: メニューを選ぶ</div>}
      {state.step === 2 && <div>STEP 2: 日付・時間を選ぶ</div>}
      {state.step === 3 && <div>STEP 3: スタッフを選ぶ（任意）</div>}
      {state.step === 4 && <div>STEP 4: 確認して予約する</div>}

      <div className="my-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "prev" })}
          disabled={state.step === 1}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium disabled:opacity-40"
        >
          戻る
        </button>

        {state.step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "next" })}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium"
          >
            次へ
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl border border-rose-500 bg-rose-500 px-5 py-3 text-sm text-white"
          >
            この内容で予約する
          </button>
        )}
      </div>
    </div>
  );
}
```

> **型のパス**  
> PDF / 参考実装は `@/types/shop` のことがあります。本プロジェクトは `@/types/shops` です。

> **未使用の props**  
> `menus` / `staffs` は今は使いません（10章用）。未使用警告が出る場合は、上のように分割で `shop` だけ取るか、引数名を残して `void menus` などで抑えてもよいです。

### なぜ BookingForm と BookingFlow に分けるか

```
BookingForm        ← Provider を置く側（ここでは useBooking 不可）
  └─ BookingProvider
       └─ BookingFlow  ← Provider の内側なので useBooking() 可
```

`useContext` は **Provider の内側（子孫）** でしか値が取れません。  
Provider を返している `BookingForm` 自身は内側に含まれないため、利用側を子コンポーネントに分けます。

| ポイント                           | 内容                                             |
| ---------------------------------- | ------------------------------------------------ |
| `state.step === 1 && ...`          | そのステップのときだけ表示                       |
| `state.step < TOTAL_STEPS ? A : B` | 最後の前は「次へ」、最後は「この内容で予約する」 |
| `disabled={state.step === 1}`      | 最初は「戻る」不可                               |
| 「この内容で予約する」             | 今は何もしない（送信は11章）                     |

---

## Part D. ページに組み込む

### Step 4. `book/page.tsx` を更新

08章と同じく、メニューとスタッフを `Promise.all` で並列取得し、`BookingForm` に渡します。

```tsx
import { notFound } from "next/navigation";
import SectionHeading from "@/components/SectionHeading";
import { getMenus, getShop, getStaffs } from "@/lib/services/shops";
import BookingForm from "@/components/booking/BookingForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookingPage({ params }: Props) {
  const { id } = await params;

  const shop = await getShop(id);
  if (!shop) {
    notFound();
  }

  const [menus, staffs] = await Promise.all([getMenus(id), getStaffs(id)]);

  return (
    <div>
      <SectionHeading
        eyebrow="Booking"
        title={`${shop.name} の予約`}
        description="メニュー・スタッフ・日時を選んで予約します。"
      />
      <div className="mt-8">
        <BookingForm shop={shop} menus={menus} staffs={staffs} />
      </div>
    </div>
  );
}
```

役割分担:

- `page.tsx`（Server）→ データ取得
- `BookingForm`（Client）→ 操作と状態

---

## Step 5. 最終動作確認

| 確認内容                          | 期待                                     |
| --------------------------------- | ---------------------------------------- |
| `/shop/1` →「この店舗で予約する」 | `/shop/1/book` へ遷移                    |
| 「次へ」                          | STEP 1 → 2 → 3 → 4                       |
| 「戻る」                          | 前の STEP へ                             |
| STEP 1 の「戻る」                 | 押せない（disabled）                     |
| STEP 4                            | 「次へ」の代わりに「この内容で予約する」 |
| 「この内容で予約する」            | 今は押しても何もしない（OK）             |

---

## 作成したファイル一覧

| ファイル                             | 役割                  | 新規 / 編集 |
| ------------------------------------ | --------------------- | ----------- |
| `app/shop/[id]/book/page.tsx`        | 予約ページ（Server）  | 新規        |
| `contexts/BookingContext.tsx`        | useReducer + Context  | 新規        |
| `components/booking/BookingForm.tsx` | ステップ UI（Client） | 新規        |

---

## まとめ（確認用）

| テーマ            | ポイント                                                    |
| ----------------- | ----------------------------------------------------------- |
| `"use client"`    | フック・イベントを使うファイルに書く。境界線より下は Client |
| Server / Client   | 取得は Server、操作は Client に切り出す                     |
| useReducer        | `dispatch(action)` → reducer が次の state を返す            |
| ユニオン型 action | `type` ごとに送る値を型で固定                               |
| Context           | Provider で配り、`useContext` で取る                        |
| useBooking        | 取り出し＋ null チェックのカスタムフック                    |
| Form / Flow 分離  | Provider の内側でのみ useBooking できる                     |
| TOTAL_STEPS       | ステップ数を定数化                                          |
| Math.min / max    | step の範囲制限                                             |

---

## つまずきやすい点

1. `"use client"` **を忘れる** → `useReducer` / `onClick` でエラー
2. **BookingForm の中で直接** `useBooking()` → Provider の外側なのでエラー。`BookingFlow` に分ける
3. **reducer で state を直接書き換える** → 画面が更新されない。必ず新しいオブジェクトを返す
4. **型パスを PDF どおり** `@/types/shop` **にする** → 本プロジェクトは `@/types/shops`
5. **全部のファイルに** `"use client"` **を付ける** → 境界の一番上だけでよい
6. **Server から関数を Props で渡そうとする** → 渡せない。データだけ渡す
7. **STEP の中身が空っぽで不安になる** → 09のゴールは切替まで。中身は10章

---

## 補足: 何を import するか（09向け）

| ファイル             | 主な import                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `book/page.tsx`      | `getShop` / `getMenus` / `getStaffs`、`BookingForm`、`notFound`   |
| `BookingContext.tsx` | `createContext` / `useContext` / `useReducer`（react）            |
| `BookingForm.tsx`    | `BookingProvider` / `useBooking` / `TOTAL_STEPS`、型（Shop など） |

迷ったら:

```
データ取得？     → services（page だけ）
状態の計算？     → contexts/BookingContext
ボタン操作？     → components/booking（Client）
```

---

以上で第9章（Client Component と状態管理）の実装は完了です。  
次章では各 STEP の中身（MenuStep など）を作ります。
