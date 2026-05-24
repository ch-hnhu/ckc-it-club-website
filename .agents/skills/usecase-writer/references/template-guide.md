# Hướng dẫn chi tiết từng trường trong mẫu Use Case

---

## Quy tắc quan trọng (BẮT BUỘC áp dụng)

### 1. UC ID — dùng tiếng Anh
Format: `UC-[ENG_CODE]-[SỐ]`
- **Đúng:** `UC-ROLE-01`, `UC-AUTH-01`, `UC-USER-01`, `UC-PERM-01`
- **Sai:** `UC-VT-01`, `UC-XTKH-01`, `UC-ND-01` ← viết tắt tiếng Việt, không dùng

Gợi ý mã theo module cho dự án này:
- `AUTH`: xác thực (đăng nhập, đăng ký, quên mật khẩu)
- `USER`: quản lý người dùng
- `ROLE`: quản lý vai trò
- `PERM`: quản lý quyền hạn
- `POST`: bài viết / tin tức
- `EVENT`: sự kiện
- `MEMBER`: thành viên CLB
- `ADMIN`: chức năng quản trị chung

### 2. Basic Flow — BF1 LUÔN là bước trigger
BF1 phải là **hành động của actor kích hoạt use case** (nhấn nút, chọn menu...), dù field Trigger đã ghi. Không bắt đầu bằng hành động của hệ thống.

- **Đúng:** `BF1: Quản trị viên nhấn nút "Thêm" trên màn hình "Quản lý vai trò".`
- **Sai:** `BF1: Dialog "Tạo vai trò" mở ra.` ← bỏ qua bước trigger, không dùng

---

## Quy tắc từng trường

### Use Case ID
`UC-[ENG_CODE]-[SỐ]` — hỏi mã nếu chưa có, mặc định dùng `WEB`.

### Description
1 câu: "[Actor] [làm gì] để [mục đích]."

### Trigger
1 câu: tên nút + màn hình.
Ví dụ: *"Quản trị viên nhấn nút 'Thêm' trên màn hình 'Quản lý vai trò'."*

### Pre-Condition(s)
Gạch đầu dòng, mỗi điều kiện tối đa 1 dòng.
```
- Đã đăng nhập với tài khoản có quyền tạo vai trò.
- Đang ở màn hình "Quản lý vai trò".
```

### Post-Condition(s)
1-2 câu: hệ thống phản hồi gì, chuyển đi đâu.
Ví dụ: *"Hiển thị toast 'Tạo vai trò thành công.' góc trên phải. Dialog đóng lại. Danh sách tự làm mới."*

### Basic Flow
Đánh số BF1, BF2... Mỗi bước **1 câu, 1 hành động**. Ghi rõ tên màn hình, tên nút, tên component. Dùng `→` để diễn đạt phản hồi tức thì.

```
BF1: Quản trị viên nhấn nút "Thêm" trên màn hình "Quản lý vai trò".   ← TRIGGER
BF2: Dialog "Tạo vai trò" mở ra.
BF3: Quản trị viên nhập Tên vai trò vào trường "Tên vai trò".
BF4: Quản trị viên nhập Slug vào trường "Giá trị".
BF5: Quản trị viên chọn "Là vai trò hệ thống?" từ Dropdown (Có / Không), mặc định là "Không".
BF6: Quản trị viên nhấn "Lưu" → hệ thống gửi yêu cầu tạo vai trò.
BF7: Hệ thống tạo thành công → hiển thị toast thành công, đóng dialog, làm mới danh sách.
```

### Alternative Flow
Chỉ viết nếu có. Ghi rõ từ BFx nào rẽ nhánh. Để trống nếu không có.
```
AF1 (Huỷ tạo): Quản trị viên nhấn "Hủy" hoặc đóng dialog → dialog đóng, dữ liệu đã nhập bị xoá.
```

### Exception Flow
Format: `EFx: [Tình huống]. Hiển thị "[thông báo]". Quay lại BFx.`
```
EF1: Tên vai trò bỏ trống. Hiển thị "Vui lòng nhập tên vai trò." dưới trường. Quay lại BF3.
EF2: Slug sai định dạng. Hiển thị "Giá trị chỉ chứa chữ thường và '-'." Quay lại BF4.
EF3: Tên vai trò đã tồn tại. Hiển thị "Tên vai trò đã tồn tại." dưới trường. Quay lại BF3.
EF4: Lỗi máy chủ không xác định. Hiển thị toast lỗi "Không thể tạo vai trò." góc trên phải.
```

### Business Rules
Format: `BRx: [Quy tắc ngắn gọn, 1 câu].` Dùng `•` nếu có nhiều tiêu chí con.
```
BR1: Tên vai trò (label) là bắt buộc, phải duy nhất trong hệ thống.
BR2: Slug chỉ chứa chữ cái thường (a-z) và dấu gạch ngang '-', phải duy nhất.
BR3: Không thể sửa hoặc xoá vai trò hệ thống (is_system = true).
```

### Non-Functional Requirement
Format: `NFRx: [Màn hình/thành phần]: [mô tả UI cụ thể].`
```
NFR1: Dialog "Tạo vai trò" gồm 2 TextField (Tên vai trò, Giá trị), 1 Dropdown (Là vai trò hệ thống?), nút "Hủy" và "Lưu".
NFR2: Nút "Lưu" hiển thị spinner khi đang xử lý và bị vô hiệu hoá để tránh gửi trùng.
NFR3: Debounce tìm kiếm 500ms để tránh gọi API liên tục.
```

---

## Ví dụ Use Case hoàn chỉnh

### UC-ROLE-02: Tạo vai trò mới

| Trường | Nội dung |
|--------|----------|
| **Use Case ID** | UC-ROLE-02 |
| **Use Case Name** | Tạo vai trò mới |
| **Description** | Quản trị viên tạo một vai trò mới để phân quyền cho người dùng trong hệ thống. |
| **Actor(s)** | Quản trị viên |
| **Priority** | Must-have |
| **Trigger** | Quản trị viên nhấn nút "Thêm" trên màn hình "Quản lý vai trò". |
| **Pre-Condition(s)** | - Đã đăng nhập với tài khoản có quyền tạo vai trò.<br>- Đang ở màn hình "Quản lý vai trò". |
| **Post-Condition(s)** | Hiển thị toast "Tạo vai trò thành công." góc trên phải. Dialog đóng lại. Danh sách vai trò tự làm mới. |
| **Basic Flow** | BF1: Quản trị viên nhấn nút "Thêm" trên màn hình "Quản lý vai trò".<br>BF2: Dialog "Tạo vai trò" mở ra.<br>BF3: Quản trị viên nhập Tên vai trò vào trường "Tên vai trò".<br>BF4: Quản trị viên nhập Slug vào trường "Giá trị".<br>BF5: Quản trị viên chọn "Là vai trò hệ thống?" từ Dropdown (Có / Không), mặc định là "Không".<br>BF6: Quản trị viên nhấn "Lưu" → hệ thống gửi yêu cầu tạo vai trò.<br>BF7: Hệ thống tạo thành công → hiển thị toast thành công, đóng dialog, làm mới danh sách. |
| **Alternative Flow** | AF1 (Huỷ tạo): Quản trị viên nhấn "Hủy" hoặc đóng dialog → dialog đóng, toàn bộ dữ liệu đã nhập bị xoá. |
| **Exception Flow** | EF1: Tên vai trò bỏ trống. Hiển thị "Vui lòng nhập tên vai trò." dưới trường. Quay lại BF3.<br>EF2: Slug bỏ trống. Hiển thị "Vui lòng nhập giá trị vai trò." dưới trường. Quay lại BF4.<br>EF3: Slug sai định dạng. Hiển thị "Giá trị chỉ chứa chữ thường và '-'." Quay lại BF4.<br>EF4: Tên vai trò đã tồn tại. Hiển thị "Tên vai trò đã tồn tại." dưới trường. Quay lại BF3.<br>EF5: Slug đã tồn tại. Hiển thị "Giá trị đã tồn tại." dưới trường. Quay lại BF4.<br>EF6: Lỗi máy chủ không xác định. Hiển thị toast lỗi "Không thể tạo vai trò." góc trên phải. |
| **Business Rules** | BR1: Tên vai trò (label) là bắt buộc, phải duy nhất trong hệ thống.<br>BR2: Slug (name) là bắt buộc, phải duy nhất, chỉ chứa chữ cái thường (a-z) và dấu gạch ngang '-'.<br>BR3: Trường "Là vai trò hệ thống?" là bắt buộc, mặc định là "Không". |
| **Non-Functional Requirement** | NFR1: Dialog "Tạo vai trò" gồm 2 TextField (Tên vai trò, Giá trị), 1 Dropdown (Là vai trò hệ thống?), nút "Hủy" và "Lưu".<br>NFR2: Nút "Lưu" hiển thị spinner khi đang xử lý và bị vô hiệu hoá để tránh gửi trùng. |

---

## Bảng từ vựng chuẩn (tiếng Việt)

| Tiếng Anh | Tiếng Việt chuẩn |
|-----------|-----------------|
| Click / Tap | Nhấn |
| User | Người dùng / Quản trị viên (tuỳ actor) |
| Screen / Page | Màn hình |
| Button | Nút |
| Dialog / Modal | Dialog |
| Toast / Snackbar | Toast |
| Dropdown | Dropdown |
| Input / Text field | Trường / Ô nhập |
| Form | Form |
| Navigate to | Chuyển sang |
| Submit | Gửi / Lưu |
| Validate | Kiểm tra |
| Error message | Thông báo lỗi |
| Loading | Đang xử lý |
| Redirect | Chuyển hướng về |
| Badge | Badge |
| Combobox | Combobox |

---

## Priority levels

| Mức độ | Ý nghĩa |
|--------|---------|
| Must-have | Bắt buộc phải có, dự án không thể thiếu |
| Should-have | Quan trọng nhưng không blocking |
| Nice-to-have | Tốt nếu có, không ảnh hưởng core |

---

## Checklist trước khi xuất kết quả

- [ ] UC ID dùng mã **tiếng Anh** (ROLE, AUTH, USER...), không dùng viết tắt tiếng Việt
- [ ] **BF1 là bước trigger** — hành động actor nhấn/chọn kích hoạt UC
- [ ] Mỗi bước Basic Flow: 1 câu, 1 hành động
- [ ] Exception Flow bao phủ tất cả validation trong code
- [ ] Không trích dẫn tên biến/hàm kỹ thuật trong đặc tả
- [ ] Văn phong nhất quán: "Quản trị viên" / "Người dùng" / "màn hình" / "nhấn"
- [ ] Toast ghi rõ nội dung và vị trí (góc trên phải)
- [ ] Post-Condition mô tả rõ UI feedback sau khi thành công
