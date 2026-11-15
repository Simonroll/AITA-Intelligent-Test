const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function generateRandomNumericCode(existingCodes, length = 3) {
  let code;
  do {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    code = String(Math.floor(min + Math.random() * (max - min + 1)));
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
}

async function main() {
  console.log('--- 1. CẬP NHẬT MÃ LỚP CÓ CHỮ SANG SỐ ---');
  const classes = await prisma.class.findMany();
  const existingCodes = new Set(classes.map(c => c.classCode));

  const updatedClasses = [];
  for (const cls of classes) {
    // Nếu classCode chứa ký tự không phải số
    if (!/^\d+$/.test(cls.classCode)) {
      existingCodes.delete(cls.classCode);
      const newNumericCode = generateRandomNumericCode(existingCodes, 3);
      const updated = await prisma.class.update({
        where: { id: cls.id },
        data: { classCode: newNumericCode }
      });
      console.log(`- Lớp "${cls.name}": Mã cũ [${cls.classCode}] -> Mã mới [${newNumericCode}]`);
      updatedClasses.push({ id: cls.id, name: cls.name, oldCode: cls.classCode, newCode: newNumericCode });
    } else {
      console.log(`- Lớp "${cls.name}": Mã hiện tại đã là số [${cls.classCode}]`);
      updatedClasses.push({ id: cls.id, name: cls.name, oldCode: cls.classCode, newCode: cls.classCode });
    }
  }

  console.log('\n--- 2. TẠO 2 TÀI KHOẢN STUDENT TEST ---');
  const passwordHash = await bcrypt.hash('AitaTest@123', 10);
  
  const testStudents = [
    { email: 'student1.test@fpt.edu.vn', fullName: 'Sinh viên Test 1' },
    { email: 'student2.test@fpt.edu.vn', fullName: 'Sinh viên Test 2' }
  ];

  const studentUsers = [];
  for (const studentData of testStudents) {
    const user = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {
        fullName: studentData.fullName,
        role: 'STUDENT',
        isActive: true,
        isApproved: true,
        passwordHash
      },
      create: {
        email: studentData.email,
        fullName: studentData.fullName,
        role: 'STUDENT',
        isActive: true,
        isApproved: true,
        passwordHash
      }
    });
    studentUsers.push(user);
    console.log(`- Đã tạo/cập nhật: ${user.fullName} (${user.email}) - Mật khẩu: AitaTest@123`);
  }

  console.log('\n--- 3. GHI DANH (ENROLL) VÀO TẤT CẢ CÁC LỚP ---');
  const allCurrentClasses = await prisma.class.findMany();
  for (const student of studentUsers) {
    for (const cls of allCurrentClasses) {
      await prisma.classEnrollment.upsert({
        where: {
          classId_studentId: {
            classId: cls.id,
            studentId: student.id
          }
        },
        update: {
          status: 'ACTIVE'
        },
        create: {
          classId: cls.id,
          studentId: student.id,
          status: 'ACTIVE'
        }
      });
    }
    console.log(`- Đã add ${student.email} vào tất cả ${allCurrentClasses.length} lớp học.`);
  }

  console.log('\n=== HOÀN TẤT THÀNH CÔNG ===');
}

main()
  .catch((e) => {
    console.error('Lỗi thực thi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
