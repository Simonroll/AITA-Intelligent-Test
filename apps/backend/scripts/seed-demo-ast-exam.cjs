const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  console.log('[Seed AST Exam] Bắt đầu khởi tạo đề thi Java Linked List để demo...');

  // 1. Tìm hoặc tạo giảng viên
  const lecturer = await db.user.findFirst({
    where: { role: 'LECTURER', email: 'lecturer.test@fpt.edu.vn' }
  });
  if (!lecturer) throw new Error('Không tìm thấy tài khoản lecturer.test@fpt.edu.vn. Vui lòng chạy npm run seed:demo trước.');

  // 2. Tìm hoặc tạo lớp học
  let cls = await db.class.findFirst({
    where: { lecturerId: lecturer.id }
  });
  if (!cls) {
    cls = await db.class.create({
      data: {
        name: 'Lớp Dự Án Phần Mềm SWP391 (FA26)',
        classCode: '778',
        semester: 'FA26',
        lecturerId: lecturer.id
      }
    });
  }

  // 3. Đảm bảo các sinh viên test được enroll vào lớp
  const students = await db.user.findMany({
    where: { role: 'STUDENT' }
  });
  for (const st of students) {
    await db.classEnrollment.upsert({
      where: { classId_studentId: { classId: cls.id, studentId: st.id } },
      create: { classId: cls.id, studentId: st.id },
      update: {}
    });
  }

  // 4. Tạo hoặc cập nhật đề thi Danh sách liên kết (JAVA)
  const examTitle = 'Thuật Toán Xử Lý Dữ Liệu: Danh sách liên kết (Linked List)';
  const now = new Date();
  const examData = {
    classId: cls.id,
    title: examTitle,
    descriptionMd: `## Bối cảnh bài toán\nTrong hệ thống xử lý dữ liệu thông minh, bài toán **Danh sách liên kết (Linked List)** đóng vai trò thiết yếu để đảm bảo độ chính xác và tính toàn vẹn của dữ liệu trong điều kiện thời gian thực.\n\n## Yêu cầu bài toán\nLập trình giải thuật giải quyết chủ đề **Danh sách liên kết (Linked List)** với độ khó **MEDIUM** trên ngôn ngữ **JAVA**.\n- Chương trình nhận vào một danh sách các phần tử dữ liệu từ luồng chuẩn (StdIn).\n- Áp dụng giải thuật Danh sách liên kết (Linked List) để tính toán kết quả theo yêu cầu bài toán.\n- Xuất kết quả tương ứng ra luồng xuất chuẩn (StdOut).\n\n## Định dạng Đầu vào\n- Dòng 1: Số nguyên $N$ ($1 \\le N \\le 10^5$).\n- Dòng 2: $N$ số nguyên $A_1, A_2, \\dots, A_N$.\n\n## Định dạng Đầu ra\n- In ra kết quả xử lý của giải thuật.\n\n### BAREM ĐIỂM ĐÁNH GIÁ (10.0 ĐIỂM)\n| Tiêu chí | Điểm | Mô tả |\n| :--- | :---: | :--- |\n| **Tính đúng đắn (Test cases)** | **6.0đ** | Vượt qua toàn bộ bộ test kiểm thử |\n| **Clean Code & Naming** | **2.0đ** | Mã nguồn rõ ràng, đặt tên biến chuẩn xác |\n| **Cấu trúc hàm & SOLID** | **1.0đ** | Phân rã bài toán thành các hàm con hợp lý |\n| **Tối ưu hiệu năng** | **1.0đ** | Thời gian thực thi trong giới hạn cho phép |`,
    allowedLanguage: 'JAVA',
    examType: 'INDIVIDUAL',
    timeLimitMs: 2000,
    memoryLimitMb: 512,
    startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Bắt đầu từ 2 tiếng trước
    endTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Kết thúc sau 14 ngày
  };

  const existingExam = await db.exam.findFirst({
    where: { classId: cls.id, title: examTitle }
  });

  const exam = existingExam
    ? await db.exam.update({ where: { id: existingExam.id }, data: examData })
    : await db.exam.create({ data: examData });

  // 5. Cài đặt 3 Test Cases chuẩn
  const testCases = [
    { inputData: '1\n10\n', expectedOutput: '10\n', isHidden: false, scoreWeight: 1.2 },
    { inputData: '3\n-5 0 5\n', expectedOutput: '0\n', isHidden: false, scoreWeight: 1.2 },
    { inputData: '6\n10 20 30 40 50 60\n', expectedOutput: '210\n', isHidden: false, scoreWeight: 1.2 }
  ];

  for (const [idx, tc] of testCases.entries()) {
    await db.testCase.upsert({
      where: { examId_orderIndex: { examId: exam.id, orderIndex: idx + 1 } },
      create: { ...tc, examId: exam.id, orderIndex: idx + 1 },
      update: tc
    });
  }

  console.log('✅ ĐÃ KHỞI TẠO XONG ĐỀ THI JAVA LINKED LIST THÀNH CÔNG!');
  console.log('Class ID:', cls.id, 'Class Code:', cls.classCode);
  console.log('Exam ID:', exam.id);
  console.log('Đề thi đã sẵn sàng cho nộp bài và demo đối soát đạo văn AST.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
