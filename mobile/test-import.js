// Teste rápido para verificar se as importações funcionam sem erro
console.log("Testando importações...");

try {
  const urls = require("./src/config/urls.ts");
  console.log("✅ URLs importadas com sucesso");
} catch (error) {
  console.error("❌ Erro ao importar URLs:", error.message);
}

try {
  const types = require("./src/types/index.ts");
  console.log("✅ Types importadas com sucesso");
} catch (error) {
  console.error("❌ Erro ao importar Types:", error.message);
}

console.log("Teste concluído");
