import axios from "axios";
import { AppDispatch, RootState } from "../store";
import {
  setInitialValues,
  syncWithSavedValues,
} from "../slices/user-form-slice";
import { getAuthToken } from "../../utils/auth";
import { CONSTANTS } from "../../constants";

export const fetchUserData = () => async (dispatch: AppDispatch) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${CONSTANTS.AUTH.AUTH_SERVER}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { username, name, email } = response.data.user;

    dispatch(setInitialValues({ name, username, email, password: "" }));
  } catch (error) {
    console.error("Erro ao buscar dados do usuário", error);
    throw error;
  }
};

export const updateUserData =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const token = await getAuthToken();
    const {
      userForm: {
        name,
        username,
        email,
        oldPassword,
        newPassword,
        isNameChanged,
        isUsernameChanged,
        isEmailChanged,
      },
    } = getState();

    try {
      if (isNameChanged) {
        await axios.put(
          `${CONSTANTS.AUTH.AUTH_SERVER}/users/update-name`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Nome atualizado com sucesso.");
      }

      if (isUsernameChanged) {
        await axios.put(
          `${CONSTANTS.AUTH.AUTH_SERVER}/users/update-username`,
          { username },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Nome de usuário atualizado com sucesso.");
      }

      if (isEmailChanged) {
        await axios.put(
          `${CONSTANTS.AUTH.AUTH_SERVER}/users/update-email`,
          { email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Email atualizado com sucesso.");
      }

      if (oldPassword && newPassword) {
        await axios.put(
          `${CONSTANTS.AUTH.AUTH_SERVER}/users/update-password`,
          { oldPassword, newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Senha atualizada com sucesso.");
      }

      // Sincronizar os valores com o backend
      dispatch(syncWithSavedValues({ name, username, email }));
    } catch (error) {
      console.error("Erro ao atualizar os dados do usuário", error);
      throw error;
    }
  };
