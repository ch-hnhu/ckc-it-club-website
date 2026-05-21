---
name: usecase-writer
description: >
  Chuyên viết đặc tả Use Case cho dự án web theo mẫu chuẩn tiếng Việt.
  Kích hoạt khi người dùng yêu cầu: viết đặc tả use case, viết UC, tạo use case spec, đặc tả chức năng, viết tài liệu yêu cầu cho một chức năng cụ thể trên web.
  Skill này sẽ TỰ ĐỘNG đọc source code hoặc mô tả dự án, phân tích chức năng, rồi điền đầy đủ vào mẫu đặc tả UC với văn phong chuyên nghiệp tiếng Việt.
  Dùng skill này BẤT CỨ KHI NÀO người dùng nhắc đến: "viết đặc tả", "viết UC", "use case spec", "tài liệu chức năng", "đặc tả usecase", hoặc muốn mô tả chi tiết luồng xử lý của một tính năng trên web.
---

# Skill: Viết Đặc Tả Use Case

Skill này giúp tự động phân tích dự án và viết đặc tả Use Case theo mẫu chuẩn tiếng Việt, đầy đủ các trường và chi tiết như một BA chuyên nghiệp.

---

## Quy trình thực hiện

### Bước 1: Thu thập thông tin dự án

Trước khi viết, agent **phải đọc và hiểu** dự án:

1. **Nếu có source code được cung cấp (file upload hoặc đường dẫn)**:
   - Đọc để **hiểu nghiệp vụ** — không trích dẫn code trong đặc tả
   - Tìm file liên quan đến chức năng (routes, controllers, services, models, components)
   - Đọc UI components để hiểu luồng màn hình
   - Đọc API handlers để hiểu logic và validation — rồi **diễn giải lại bằng ngôn ngữ người dùng cuối**
   - Đọc DB schema nếu có để hiểu dữ liệu

2. **Nếu chỉ có mô tả bằng lời**:
   - Hỏi thêm các câu hỏi cần thiết về actor, màn hình, luồng chính
   - Không bịa đặt thông tin không có cơ sở

3. **Thông tin cần xác định trước khi viết**:
   - Tên chức năng và Use Case ID
   - Actor chính (ai sử dụng chức năng này)
   - Trigger (hành động nào kích hoạt use case)
   - Pre-conditions (điều kiện tiên quyết)
   - Màn hình liên quan và luồng điều hướng
   - Validation rules (từ source code hoặc yêu cầu)
   - Kết quả thành công (Post-conditions)

---

### Bước 2: Điền mẫu đặc tả Use Case

Sau khi phân tích, xuất kết quả **trực tiếp dưới dạng bảng Markdown trong chat** — không tạo file. Xem file `references/template-guide.md` để biết chi tiết từng trường.

**Định dạng xuất ra:**

**Mẫu bảng đặc tả (Markdown):**

| Trường | Nội dung |
|--------|----------|
| Use Case ID | UC-[MÃ_DỰ_ÁN]-[SỐ_THỨ_TỰ] (ví dụ: UC-XTKH-01) |
| Use Case Name | Tên chức năng ngắn gọn bằng tiếng Việt |
| Description | Mô tả ngắn mục đích của use case (1-2 câu) |
| Actor(s) | Tên vai trò người dùng (Khách hàng / Admin / Nhân viên...) |
| Priority | Must-have / Should-have / Nice-to-have |
| Trigger | Hành động cụ thể kích hoạt use case |
| Pre-Condition(s) | Danh sách điều kiện phải thỏa mãn trước khi thực hiện |
| Post-Condition(s) | Trạng thái hệ thống sau khi use case hoàn thành thành công |
| Basic Flow | BF1, BF2, BF3... mô tả từng bước chi tiết |
| Alternative Flow | AF1, AF2... các luồng thay thế (nếu có) |
| Exception Flow | EF1, EF2... các trường hợp lỗi và hành động xử lý |
| Business Rules | BR1, BR2... các quy tắc nghiệp vụ ràng buộc dữ liệu và hành vi hệ thống |
| Non-Functional Requirement | NFR1, NFR2... các yêu cầu phi chức năng về giao diện, hiệu năng, trải nghiệm |

---

### Bước 3: Quy tắc viết nội dung từng trường

#### Use Case ID
- Format: `UC-[MÃ]-[SỐ]` — ví dụ: `UC-XTKH-01`, `UC-AUTH-02`
- Mã dự án do người dùng cung cấp hoặc hỏi nếu chưa có
- Số thứ tự tăng dần theo nhóm chức năng

#### Description
- 1 câu ngắn: "[Actor] muốn [làm gì] để [mục đích]."
- Ví dụ: *"Người dùng muốn đăng ký tài khoản để sử dụng ứng dụng."*

#### Trigger
- 1 câu, nêu tên nút và màn hình kích hoạt.
- Ví dụ: *"Người dùng nhấn nút Đăng ký trên màn hình Đăng nhập."*

#### Pre-Condition(s)
- Gạch đầu dòng, mỗi điều kiện 1 dòng ngắn gọn.
- Ví dụ: `- Thiết bị có kết nối mạng.` / `- Người dùng chưa đăng nhập.`

#### Post-Condition(s)
- 1-2 câu: UI phản hồi gì và chuyển đi đâu.
- Ví dụ: *"Hệ thống hiển thị Dialog 'Đăng ký thành công'. Người dùng nhấn 'Đồng ý' để về trang Đăng nhập."*

#### Basic Flow
- Đánh số BF1, BF2... Mỗi bước **1 câu**, 1 hành động. Ghi tên màn hình/nút/component khi cần thiết.
- **Không giải thích thêm** — chỉ mô tả hành động/kết quả.
- Ví dụ:
  ```
  BF1: Chuyển sang màn hình "Đăng ký – Bước 1".
  BF2: Người dùng nhập Họ tên, Email, Số điện thoại, Địa chỉ.
  BF3: Người dùng chọn Ngày sinh từ Dropdown lịch.
  BF4: Người dùng nhấn "Tiếp tục" → chuyển sang màn hình "Đăng ký – Bước 2".
  ```

#### Alternative Flow
- Chỉ viết khi có luồng thay thế thực sự. Ghi rõ từ BFx nào. Để trống nếu không có.

#### Exception Flow
- Đánh số EF1, EF2... Format: *"[Tình huống lỗi]. Hiển thị '[thông báo]'. Quay lại BFx."*
- Mỗi EF **1 câu duy nhất**, không giải thích dài.
- Ví dụ:
  ```
  EF1: Email bỏ trống. Hiển thị "Email không được để trống". Quay lại BF2.
  EF2: Email sai định dạng. Hiển thị "Email không hợp lệ". Quay lại BF2.
  EF3: Email đã tồn tại. Hiển thị "Email đã được sử dụng". Quay lại BF2.
  ```

#### Business Rules
- Đánh số BR1, BR2... Mỗi rule **1 câu** hoặc danh sách `•` nếu có nhiều tiêu chí con.
- Ví dụ:
  ```
  BR1: Họ tên từ 1–254 ký tự.
  BR2: Email đúng định dạng, chứa "@".
  BR3: Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
  BR4: Mỗi Email chỉ được đăng ký một tài khoản.
  ```

#### Non-Functional Requirement
- Đánh số NFR1, NFR2... Mô tả ngắn gọn cấu trúc màn hình và thành phần UI chính.
- Ví dụ:
  ```
  NFR1: Quy trình gồm 2 màn hình: "Đăng ký – Bước 1" và "Đăng ký – Bước 2".
  NFR2: Màn hình Bước 1: 4 TextField, 1 Dropdown ngày sinh, 1 Button "Tiếp tục".
  NFR3: Màn hình Bước 2: khu vực Avatar + nút tải ảnh, 2 TextField mật khẩu, 1 Button "Đăng ký".
  ```

---

### Bước 4: Xử lý nhiều Use Case

Nếu người dùng yêu cầu viết nhiều UC cho một module/dự án:

1. Đọc source code một lần, phân tích tất cả các chức năng
2. Tạo danh sách Use Cases cần viết, hỏi user xác nhận
3. Viết lần lượt từng UC dưới dạng bảng Markdown trong chat, mỗi UC cách nhau bằng dấu `---`

---

## Hỏi thêm khi thiếu thông tin

Nếu chưa đủ thông tin để viết, hỏi người dùng theo thứ tự ưu tiên:

1. **Tên chức năng cần viết UC** (bắt buộc)
2. **Mã dự án** để tạo Use Case ID (nếu chưa có, dùng "WEB" làm mặc định)
3. **Actor** là ai (nếu không rõ từ context)
4. **Source code hoặc mô tả chi tiết** của chức năng

Không hỏi tất cả cùng lúc — hỏi từng câu theo thứ tự.

---

## Lưu ý quan trọng

- **Súc tích là ưu tiên số 1** — mỗi câu chỉ nói 1 ý, không giải thích thừa, không lặp lại thông tin đã có ở trường khác
- **Không trích dẫn code** — đọc code để hiểu, diễn giải lại bằng ngôn ngữ tự nhiên, không để tên biến/hàm kỹ thuật trong đặc tả
- **Viết cho tester đọc** — ngôn ngữ người dùng cuối, không cần biết lập trình cũng hiểu
- **Văn phong nhất quán**: "Người dùng" / "màn hình" / "nhấn"
- **Không tạo file** — xuất kết quả dạng bảng Markdown trực tiếp trong chat
