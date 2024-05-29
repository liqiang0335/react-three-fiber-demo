/// <reference types="vite/client" />

export type AddDispatch<T> = {
  dispatch: (data: {
    [key in keyof T]?: T[key];
  }) => void;
} & T;
