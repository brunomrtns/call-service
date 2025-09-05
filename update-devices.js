const { PrismaClient } = require('@prisma/client');

async function updateDevices() {
  const prisma = new PrismaClient();
  
  try {
    // Atualizar device do brunomrtns para 3005
    await prisma.callUser.update({
      where: { username: 'brunomrtns' },
      data: { device: '3005' }
    });
    
    // Atualizar device do teste para 3006
    await prisma.callUser.update({
      where: { username: 'teste' },
      data: { device: '3006' }
    });
    
    console.log('✅ Devices atualizados com sucesso!');
    console.log('brunomrtns: device 3005');
    console.log('teste: device 3006');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar devices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDevices();
