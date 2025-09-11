import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserFormState {
  name: string;
  username: string;
  email: string;
  password: string;
  oldPassword: string;
  newPassword: string;
  isNameChanged: boolean;
  isEmailChanged: boolean;
  isUsernameChanged: boolean;
  initialName: string;
  initialUsername: string;
  initialEmail: string;
}

const initialState: UserFormState = {
  name: "",
  username: "",
  email: "",
  password: "",
  oldPassword: "",
  newPassword: "",
  isNameChanged: false,
  isUsernameChanged: false,
  isEmailChanged: false,
  initialName: "",
  initialUsername: "",
  initialEmail: "",
};

const userFormSlice = createSlice({
  name: "userForm",
  initialState,
  reducers: {
    setInitialValues(
      state,
      action: PayloadAction<{
        name: string;
        username: string;
        email: string;
        password: string;
      }>
    ) {
      const { name, username, email, password } = action.payload;
      state.name = name;
      state.username = username;
      state.email = email;
      state.password = password;
      state.initialName = name;
      state.initialUsername = username;
      state.initialEmail = email;
      state.isNameChanged = false;
      state.isUsernameChanged = false;
      state.isEmailChanged = false;
    },
    updateName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      state.isNameChanged = action.payload !== state.initialName;
    },
    updateUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
      state.isUsernameChanged = action.payload !== state.initialUsername;
    },
    updateEmail(state, action: PayloadAction<string>) {
      state.email = action.payload;
      state.isEmailChanged = action.payload !== state.initialEmail;
    },
    updatePassword(
      state,
      action: PayloadAction<{ oldPassword: string; newPassword: string }>
    ) {
      state.oldPassword = action.payload.oldPassword;
      state.newPassword = action.payload.newPassword;
    },
    syncWithSavedValues(
      state,
      action: PayloadAction<{
        name: string;
        username: string;
        email: string;
      }>
    ) {
      const { name, username, email } = action.payload;
      state.initialName = name;
      state.initialUsername = username;
      state.initialEmail = email;
      state.name = name;
      state.username = username;
      state.email = email;
      state.isNameChanged = false;
      state.isUsernameChanged = false;
      state.isEmailChanged = false;
    },
  },
});

export const {
  setInitialValues,
  updateName,
  updateUsername,
  updateEmail,
  updatePassword,
  syncWithSavedValues,
} = userFormSlice.actions;

export default userFormSlice.reducer;
