import { configureStore } from "@reduxjs/toolkit";
import userFormSlice from "./slices/user-form-slice";

export const store = configureStore({
  reducer: {
    userForm: userFormSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
