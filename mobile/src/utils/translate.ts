import axios from "axios";

export const translateText = async (
  text: string,
  source: string,
  target: string
) => {
  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${source}|${target}`
    );
    return response.data.responseData.translatedText;
  } catch (error) {
    console.error("Erro ao traduzir:", error);
    return "Erro ao traduzir.";
  }
};
