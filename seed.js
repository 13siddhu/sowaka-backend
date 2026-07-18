const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@sowaka.com' },
    update: {},
    create: {
      employeeId: 'SA-001',
      name: 'Super Admin',
      email: 'superadmin@sowaka.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  
  console.log('Super Admin Seeded:', superAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
