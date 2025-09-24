import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import permisosReducer from "./slices/permisosSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    permisos: permisosReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;