# Báo cáo kiểm thử — AITA Milestone 3

**Ngày kiểm tra:** 03/11/2026  
**Phạm vi:** Kiểm tra trạng thái test tự động hiện có và chuẩn bị checklist kiểm thử demo thủ công.  
**Kết luận hiện tại:** Build thành công. Unit + integration đạt **67/72 (93.1%)** theo summary trước đó của `node:test`; lần chạy sandbox mới nhất đạt **18/18 (100%)**, không có test fail. Người dùng xác nhận checklist thủ công **28/28 Passed (100%)**. Kết quả thủ công được ghi theo xác nhận của người dùng.

## 1. Kết quả chạy hiện tại

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `npm.cmd --prefix apps/backend test` | **40 passed / 43; 3 failed (93.0%)** | Build thành công. Một assertion Google account linking không còn khớp logic hiện tại; một assertion Git lifecycle nhận `teamRepoUrl` là `undefined`. Summary của Node cũng tính suite cha thất bại khi test con thất bại. |
| `NODE_ENV=test npm.cmd --prefix apps/backend run test:integration` | **27 passed / 29; 2 failed (93.1%)** | Test DB được migrate trước khi chạy. Lỗi còn lại: test Google kỳ vọng đăng ký tài khoản FPT tự do với HTTP 200, trong khi app hiện khóa đăng ký công khai và trả 403; summary cũng đánh dấu suite cha fail. |
| `npm.cmd --prefix apps/backend run test:sandbox` | **18 passed / 18; 0 failed (100%)** | Kết quả chạy lại do người dùng cung cấp: cả ba ngôn ngữ, compiler error, timeout/resource limits, bảo mật runner, hidden output, upload và plagiarism đều pass. |

Nguồn lệnh test chính được khai báo trong `apps/backend/package.json`: build rồi chạy `unit.test.cjs`, `ast-plagiarism.test.cjs`, `appeal.test.cjs`, `group-exam-git.test.cjs` và `ai.test.cjs`. Summary lần chạy hiện tại báo 43 test, 40 pass, 3 fail. `ai.test.cjs` có **8 test pass** về local AI provider và key pool. Đây là test tự động cho logic AI; không chứng minh test được sinh bởi AI hoặc chất lượng dịch vụ provider bên ngoài.

**Tỷ lệ 93.1%** ở trên chỉ gộp unit + integration: (40 + 27) / (43 + 29); sandbox được báo riêng là **18/18 (100%)**. Các lần chạy unit/integration và sandbox là những lần chạy riêng. Checklist thủ công được báo riêng: 28/28 Passed theo xác nhận người dùng.

## 2. Số liệu lịch sử trong repo

`apps/backend/tests/INTEGRATION_TEST_REPORT.md` ghi ngày 17/10/2026:

- Unit: 43/43 ở lần chạy lịch sử.
- Integration: 29/29 ở lần chạy lịch sử với PostgreSQL test và Redis.
- Frontend production build: thành công ở lần chạy lịch sử.
- Sandbox: lịch sử chưa xác nhận do Docker Engine (`EPERM`); lần chạy mới nhất bên trên đã chạy được với Docker.

Các số liệu này là lịch sử và không thay thế lần chạy hiện tại. Lỗi build ban đầu ngày 03/11/2026 đã được sửa ở `submission.service.ts` bằng cách dùng đúng các trường `actorId`, `entityType`, `entityId`; sau đó các suite đã chạy và có kết quả ở bảng trên.

## 3. Checklist kiểm thử thủ công cho demo (28 ca)

Các ca bên dưới đã được người dùng xác nhận đã thực hiện thủ công và đạt kết quả mong đợi. Báo cáo ghi trạng thái Passed theo xác nhận đó; ảnh chụp/log thực hiện chưa được đính kèm trong repo.

| ID | Module | Test case / bước chính | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| M01 | Auth & lớp | Đăng nhập lecturer bằng tài khoản demo | Vào đúng lecturer dashboard | Passed |
| M02 | Auth & lớp | Sinh viên đăng nhập và xem lớp đã ghi danh | Chỉ thấy lớp được phép | Passed |
| M03 | Auth & lớp | Sinh viên nhập mã lớp hợp lệ | Được ghi danh và lớp xuất hiện | Passed |
| M04 | Auth & lớp | Tài khoản không có quyền thử mở trang lecturer | Bị từ chối hoặc điều hướng an toàn | Passed |
| M05 | Import | Preview file roster hợp lệ | Hiện mapping và các dòng có thể import | Passed |
| M06 | Import | Preview roster có email sai định dạng | Báo lỗi dòng; không commit một phần | Passed |
| M07 | Import | Preview tài khoản không phải STUDENT | Báo không đủ điều kiện; khóa commit | Passed |
| M08 | Import | Commit file hợp lệ | Enrollment được ghi nhận chính xác | Passed |
| M09 | Submission | Nộp ZIP hợp lệ cho exam đang mở | Tạo receipt và trạng thái chờ chấm | Passed |
| M10 | Submission | Nộp sai định dạng file | API từ chối; không tạo bài nộp rác | Passed |
| M11 | Submission | Sinh viên chưa ghi danh thử nộp bài | API từ chối theo quyền lớp | Passed |
| M12 | Queue | Worker đang chạy xử lý bài trong queue | Trạng thái được cập nhật sau khi chấm | Passed |
| M13 | Sandbox | Nộp fixture lỗi biên dịch | Lưu lỗi biên dịch; worker tiếp tục phục vụ job khác | Passed |
| M14 | Sandbox | Nộp `demo/exception-paths/04-submission-timeout.zip` | Job kết thúc do timeout; không treo worker | Passed |
| M15 | Sandbox | Chạy case vượt giới hạn output | Output bị giới hạn; job kết thúc có trạng thái | Passed |
| M16 | Sandbox | Kiểm tra container sau khi chấm | Container được dọn; không để runner chạy sót | Passed |
| M17 | AST/Winnowing | Quét hai bài tương đương đổi tên biến | Sinh fingerprint và báo cáo tương đồng | Passed |
| M18 | AST/Winnowing | Quét hai bài khác cấu trúc | Điểm tương đồng thấp hơn trường hợp tương đương | Passed |
| M19 | AST/Winnowing | Xem báo cáo pair plagiarism | Lecturer thấy phần mã/dòng so khớp | Passed |
| M20 | AST/Winnowing | Lecturer đánh dấu kết quả điều tra | Quyết định và ghi chú được lưu | Passed |
| M21 | AI | Tạo đề bằng local fallback khi không cấu hình provider ngoài | Trả đề theo input hoặc thông báo fallback rõ ràng | Passed |
| M22 | AI | Gửi yêu cầu với provider key hợp lệ | Trả kết quả và hiển thị trạng thái phù hợp | Passed |
| M23 | AI | Mô phỏng key gặp rate limit/cooldown | Pool bỏ qua key đang cooldown theo logic cấu hình | Passed |
| M24 | AI | Kiểm tra giải thích lỗi biên dịch | Nội dung giải thích khớp ngôn ngữ/lỗi đầu vào | Passed |
| M25 | Appeals | Sinh viên gửi appeal trong thời hạn | Appeal xuất hiện trong danh sách lecturer | Passed |
| M26 | Appeals | Lecturer xử lý appeal | Trạng thái/ghi chú kết quả được lưu | Passed |
| M27 | Git analytics | Đồng bộ repository nhóm có dữ liệu | Hiện commits, LOC, tỷ lệ đóng góp | Passed |
| M28 | Git analytics | Đồng bộ thất bại hoặc repository rỗng | Không tạo số liệu giả; trạng thái lỗi/rỗng rõ ràng | Passed |

## 4. Ghi nhận sau khi chạy checklist

Trạng thái 28 ca được ghi là `Passed` theo xác nhận của người dùng. Ảnh chụp/log chưa được đính kèm trong repo. Nếu cần audit, bổ sung bằng chứng và thông tin người thực hiện/ngày chạy. Tính pass rate trên các ca đã thực thi: `Passed / (Passed + Failed)`. Ca `Blocked` cần được báo riêng, không tính như đã pass.

| Module | Số ca kế hoạch | Passed | Failed | Blocked | Chưa chạy |
|---|---:|---:|---:|---:|---:|
| Auth, lớp & import | 8 | 8 | 0 | 0 | 0 |
| Submission & sandbox | 8 | 8 | 0 | 0 | 0 |
| AST/Winnowing | 4 | 4 | 0 | 0 | 0 |
| AI | 4 | 4 | 0 | 0 | 0 |
| Appeals & Git analytics | 4 | 4 | 0 | 0 | 0 |
| **Tổng** | **28** | **28** | **0** | **0** | **0** |

## 5. Ghi chú và việc còn lại

1. Cập nhật test Google-link và test đăng ký integration theo chính sách hiện tại (không đăng ký công khai).
2. Sửa test/implementation của Git submission để xác định rõ `teamRepoUrl` có cần được trả trong kết quả hay không.
3. Sandbox suite đã pass **18/18 (100%)** trong lần chạy mới nhất. Các thay đổi khắc phục C# mutex và trình tự đóng/mở exam trong test đã được xác nhận.
4. AI review nền trong sandbox integration test được stub để tránh ghi AIReview sau khi fixture bị xóa.
5. Các số liệu unit/integration cũ vẫn có test fail như mô tả ở mục 1; xử lý chúng nếu cần báo cáo toàn bộ automated suite là 100%. Checklist thủ công 28/28 được ghi theo xác nhận người dùng; ảnh chụp/log chưa đính kèm.

