import axios from "axios";
import { fetchToken } from "./generate-token";

const PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const GOOGLE_TRANSLATE_URL = "https://translate.google.com/translate_a/single";

export const translateText = async ({ text, from, to }) => {
  const errors = [
    "Text must not exceed 5000 bytes",
    "The server returned an empty response",
    "Could not get token from Google",
    "Text translation request failed",
  ];
  console.log("Iniciando tradução");

  try {
    const token = fetchToken(text);
    const params = new URLSearchParams({
      tk: token,
      client: "gtx",
      q: text,
      sl: from,
      tl: to,
      dt: "t",
    });

    const response = await axios.get(
      `${PROXY_URL}${GOOGLE_TRANSLATE_URL}?${params}`
    );
    const translation = response.data[0]
      .map((segment) => segment[0] || "")
      .join("");

    return translation;
  } catch (error) {
    console.error("Translation Error:", error.message || error);
    throw new Error(errors[3]);
  }
};
