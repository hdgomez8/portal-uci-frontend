import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { obtenerPermisos } from "../../services/apiPermisos";

export const fetchPermisos = createAsyncThunk("permisos/fetch", async () => {
    return await obtenerPermisos();
});

const permisosSlice = createSlice({
    name: "permisos",
    initialState: { permisos: [], status: "idle", error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPermisos.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPermisos.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.permisos = action.payload;
            })
            .addCase(fetchPermisos.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export default permisosSlice.reducer;
