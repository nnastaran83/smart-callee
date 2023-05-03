import {createSlice} from "@reduxjs/toolkit";
import {signInUser} from "../thunks/signInUser.js";


const loginPageSlice = createSlice({
    name: "loginPage",

    initialState: {
        userName: "",
        email: "",
        password: "",
        showPassword: false,
        isLoading: false,
        error: null,

    },

    reducers: {
        setUserName: (state, action) => {
            return {...state, userName: action.payload};
        },

        setEmail: (state, action) => {
            return {...state, email: action.payload};
        },

        setPassword: (state, action) => {
            return {...state, password: action.payload};
        },

        changePasswordVisibility: (state) => {
            return {...state, showPassword: !state.showPassword};
        },

    },
    extraReducers(builder) {
        builder.addCase(signInUser.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(signInUser.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(signInUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });


    }
});


export const {changePasswordVisibility, setUserName, setEmail, setPassword} = loginPageSlice.actions;
export const loginPageReducer = loginPageSlice.reducer;