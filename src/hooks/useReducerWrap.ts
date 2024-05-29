import { useReducer } from "react";

function reducer<T>(state: T, action: T): T {
  return { ...state, ...action };
}

type Dispatch<T> = {
  (action: { [K in keyof T]?: any }): void;
};

/**
 * 状态管理
 * @param initialState 初始值
 *
 * @example
 * const [state, dispatch] = useReducerWrap({ count: 0 });
 */
export function useReducerWrap<T>(initialState: T): [T, Dispatch<T>] {
  return useReducer(reducer, initialState) as [T, Dispatch<T>];
}
