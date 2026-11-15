# ĐỀ THI DEMO: DANH SÁCH LIÊN KẾT (LINKED LIST) - JAVA

File này dùng để copy thông tin tạo đề thi thủ công khi chuyển sang máy khác.

---

## 1. THÔNG TIN CƠ BẢN ĐỀ THI

* **Tiêu đề đề thi (Title):**
```text
Thuật Toán Xử Lý Dữ Liệu: Danh sách liên kết (Linked List)
```

* **Ngôn ngữ cho phép (Allowed Language):** `JAVA`
* **Hình thức (Exam Type):** `Cá nhân (INDIVIDUAL)`
* **Thời gian thực thi tối đa (Time Limit):** `2000` ms
* **Bộ nhớ tối đa (Memory Limit):** `512` MB
* **Thời gian bắt đầu / kết thúc:** Đặt thời gian hiện tại để mở đề ngay.

---

## 2. NỘI DUNG MÔ TẢ ĐỀ THI (MARKDOWN)
*(Copy toàn bộ khối Markdown bên dưới dán vào ô mô tả đề thi)*

```markdown
## Bối cảnh bài toán
Trong hệ thống xử lý dữ liệu thông minh, bài toán **Danh sách liên kết (Linked List)** đóng vai trò thiết yếu để đảm bảo độ chính xác và tính toàn vẹn của dữ liệu trong điều kiện thời gian thực.

## Yêu cầu bài toán
Lập trình giải thuật giải quyết chủ đề **Danh sách liên kết (Linked List)** với độ khó **MEDIUM** trên ngôn ngữ **JAVA**.
- Chương trình nhận vào một danh sách các phần tử dữ liệu từ luồng chuẩn (StdIn).
- Áp dụng giải thuật Danh sách liên kết (Linked List) để tính toán kết quả theo yêu cầu bài toán.
- Xuất kết quả tương ứng ra luồng xuất chuẩn (StdOut).

## Định dạng Đầu vào
- Dòng 1: Số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_1, A_2, \dots, A_N$.

## Định dạng Đầu ra
- In ra kết quả xử lý của giải thuật.

### BAREM ĐIỂM ĐÁNH GIÁ (10.0 ĐIỂM)
| Tiêu chí | Điểm | Mô tả |
| :--- | :---: | :--- |
| **Tính đúng đắn (Test cases)** | **6.0đ** | Vượt qua toàn bộ bộ test kiểm thử |
| **Clean Code & Naming** | **2.0đ** | Mã nguồn rõ ràng, đặt tên biến chuẩn xác |
| **Cấu trúc hàm & SOLID** | **1.0đ** | Phân rã bài toán thành các hàm con hợp lý |
| **Tối ưu hiệu năng** | **1.0đ** | Thời gian thực thi trong giới hạn cho phép |
```

---

## 3. BỘ 3 TEST CASES KIỂM THỬ

### Test Case 1:
* **Dữ liệu đầu vào (Input):**
```text
1
10
```
* **Kết quả mong đợi (Output):**
```text
10
```
* **Trọng số điểm (Weight):** `1.2` (hoặc để mặc định)

---

### Test Case 2:
* **Dữ liệu đầu vào (Input):**
```text
3
-5 0 5
```
* **Kết quả mong đợi (Output):**
```text
0
```
* **Trọng số điểm (Weight):** `1.2`

---

### Test Case 3:
* **Dữ liệu đầu vào (Input):**
```text
6
10 20 30 40 50 60
```
* **Kết quả mong đợi (Output):**
```text
210
```
* **Trọng số điểm (Weight):** `1.2`

---

## 4. BẢNG TRA CỨU FILE NỘP BÀI (DEMO AST)

| File nộp (.zip) | Điểm số test | Mức độ tương đồng AST | Nhãn hệ thống | Ý nghĩa đối soát |
| :--- | :---: | :---: | :---: | :--- |
| **`bainop1.zip`** | 3.6 / 3.6 pts | **100% (Mốc)** | Bản gốc | Code chuẩn Singly Linked List để làm đối chứng. |
| **`bainop2.zip`** | 3.6 / 3.6 pts | **100%** | 🔴 Nguy cơ rất cao | Đạo văn lộ liễu: Chỉ đổi tên biến, tên hàm, thêm comment. |
| **`bainop3.zip`** | 3.6 / 3.6 pts | **83.1%** | 🔴 Nguy cơ rất cao | Đạo văn tinh vi: Đổi vòng lặp while/for, chèn thêm hàm phụ isEmpty(). |
| **`bainop4.zip`** | 3.6 / 3.6 pts | **67.9%** | 🟡 Tương đồng vừa | Cải biên thuật toán: Dùng BufferedReader + Đệ quy tính tổng. |
| **`bainop5.zip`** | 3.6 / 3.6 pts | **54.3%** | 🟡 Tương đồng vừa | Lập trình khác biệt: Dùng Doubly Linked List + Iterable. |
| **`bainop_xanh.zip`** | 3.6 / 3.6 pts | **46.3%** | 🟢 Tương đồng thấp | An toàn: Lập trình hàm Functional Linked List (Cons/Nil). |

* **LƯU Ý:** Khi nộp bài trên web, ô **Entrypoint** luôn điền là: **`Main`**
