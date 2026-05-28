const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sbkt.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@sbkt.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Other users
  const users = [
    { name: 'Purchase Manager', email: 'purchase@sbkt.com', role: 'PURCHASE_MANAGER' },
    { name: 'HR Manager', email: 'hr@sbkt.com', role: 'HR_MANAGER' },
    { name: 'Accountant', email: 'accounts@sbkt.com', role: 'ACCOUNTANT' },
    { name: 'Store Manager', email: 'store@sbkt.com', role: 'STORE_MANAGER' },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash('Password@123', 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hashed },
    });
    console.log(`✅ User: ${u.email}`);
  }

  // Sample suppliers
  const suppliers = [
    { supplierCode: 'SUP-0001', name: 'Rajesh Yarn Trading Co.', gstNumber: '24AAAAA1234A1Z5', phone: '9876543210', address: 'Surat, Gujarat', paymentTerms: 'Net 30' },
    { supplierCode: 'SUP-0002', name: 'Gujarat Beam Suppliers', gstNumber: '24BBBBB5678B2Z6', phone: '9876543211', address: 'Ahmedabad, Gujarat', paymentTerms: 'Net 15' },
    { supplierCode: 'SUP-0003', name: 'Mehta Chemical Works', gstNumber: '24CCCCC9012C3Z7', phone: '9876543212', address: 'Vadodara, Gujarat', paymentTerms: 'Net 7' },
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { supplierCode: s.supplierCode },
      update: {},
      create: s,
    });
    console.log(`✅ Supplier: ${s.name}`);
  }

  // Sample inventory items
  const inventoryItems = [
    { materialName: 'YARN', category: 'YARN', unit: 'KG', currentStock: 500, minStockLevel: 100 },
    { materialName: 'BEAM', category: 'BEAM', unit: 'PCS', currentStock: 50, minStockLevel: 10 },
    { materialName: 'DYE_CHEMICAL', category: 'CHEMICALS', unit: 'LTR', currentStock: 200, minStockLevel: 50 },
    { materialName: 'FABRIC', category: 'FABRIC', unit: 'MTR', currentStock: 1000, minStockLevel: 200 },
    { materialName: 'PACKING_MATERIAL', category: 'PACKING_MATERIALS', unit: 'PCS', currentStock: 500, minStockLevel: 100 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { materialName_category: { materialName: item.materialName, category: item.category } },
      update: {},
      create: item,
    });
    console.log(`✅ Inventory: ${item.materialName}`);
  }

  // Sample employees
  const employees = [
    { employeeCode: 'EMP-0001', fullName: 'Raju Patel', mobile: '9876543220', address: 'Surat', role: 'MASTER', joiningDate: new Date('2022-01-01'), salaryType: 'MONTHLY', basicSalary: 18000, shift: 'MORNING' },
    { employeeCode: 'EMP-0002', fullName: 'Suresh Kumar', mobile: '9876543221', address: 'Surat', role: 'KARIGAR', joiningDate: new Date('2022-03-15'), salaryType: 'DAILY_WAGE', basicSalary: 600, shift: 'MORNING' },
    { employeeCode: 'EMP-0003', fullName: 'Mohan Das', mobile: '9876543222', address: 'Surat', role: 'HELPER', joiningDate: new Date('2023-06-01'), salaryType: 'DAILY_WAGE', basicSalary: 450, shift: 'EVENING' },
    { employeeCode: 'EMP-0004', fullName: 'Priya Sharma', mobile: '9876543223', address: 'Surat', role: 'ACCOUNTANT', joiningDate: new Date('2021-09-01'), salaryType: 'MONTHLY', basicSalary: 22000, shift: 'MORNING' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {},
      create: emp,
    });
    console.log(`✅ Employee: ${emp.fullName}`);
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:    admin@sbkt.com    / Admin@123');
  console.log('  Purchase: purchase@sbkt.com / Password@123');
  console.log('  HR:       hr@sbkt.com       / Password@123');
  console.log('  Accounts: accounts@sbkt.com / Password@123');
  console.log('  Store:    store@sbkt.com    / Password@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
