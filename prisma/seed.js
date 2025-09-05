"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seeding...');
    // Create admin user
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.callUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'Administrator',
            username: 'admin',
            email: 'admin@callservice.com',
            password: adminPassword,
            type: 'admin'
        }
    });
    console.log('Created admin user:', admin.username);
    // Create attendant user
    const attendantPassword = await bcryptjs_1.default.hash('attendant123', 10);
    const attendantDevice = '3001';
    const attendantDevicePassword = await bcryptjs_1.default.hash(attendantDevice, 10);
    const attendant = await prisma.callUser.upsert({
        where: { username: 'attendant' },
        update: {},
        create: {
            name: 'Call Attendant',
            username: 'attendant',
            email: 'attendant@callservice.com',
            password: attendantPassword,
            type: 'attendant',
            device: attendantDevice,
            devicePassword: attendantDevicePassword
        }
    });
    console.log('Created attendant user:', attendant.username, 'with device:', attendant.device);
    // Create sample client users
    const clientPassword = await bcryptjs_1.default.hash('client123', 10);
    const clients = [
        {
            name: 'João Silva',
            username: 'joao.silva',
            email: 'joao@exemplo.com',
            device: '3002'
        },
        {
            name: 'Maria Santos',
            username: 'maria.santos',
            email: 'maria@exemplo.com',
            device: '3003'
        },
        {
            name: 'Carlos Oliveira',
            username: 'carlos.oliveira',
            email: 'carlos@exemplo.com',
            device: '3004'
        }
    ];
    for (const clientData of clients) {
        const devicePassword = await bcryptjs_1.default.hash(clientData.device, 10);
        const client = await prisma.callUser.upsert({
            where: { username: clientData.username },
            update: {},
            create: {
                ...clientData,
                password: clientPassword,
                type: 'client',
                devicePassword
            }
        });
        console.log('Created client user:', client.username, 'with device:', client.device);
    }
    console.log('Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map