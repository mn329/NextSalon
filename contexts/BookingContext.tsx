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

// 4. 予約アクション(動作)の型を定義
export type BookingAction =
  | { type: "select-menu"; menuId: string }
  | { type: "select-staff"; staffId: string | null }
  | { type: "select-date"; date: string }
  | { type: "select-time"; time: string }
  | { type: "change-notes"; notes: string }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" };

// 5. 予約リデューサー(状態を更新する関数)を定義
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
