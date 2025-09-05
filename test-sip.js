// Teste simples para verificar a importação do SipService
const path = require('path');

// Registrar tsconfig-paths
require('tsconfig-paths/register');

console.log('Tentando importar SipService...');

try {
  const sipService = require('./src/services/sip.service.ts');
  console.log('SipService importado:', sipService);
  console.log('SipService.default:', sipService.default);
  console.log('SipService.SipService:', sipService.SipService);
} catch (error) {
  console.error('Erro ao importar SipService:', error);
}
