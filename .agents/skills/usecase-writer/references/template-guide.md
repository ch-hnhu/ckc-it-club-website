# Hướng dẫn chi tiết từng trường trong mẫu Use Case

## Ví dụ mẫu hoàn chỉnh (từ template gốc)

Dựa trên use case "Đăng ký tài khoản" (UC-XTKH-01):

### Use Case ID: UC-XTKH-01
### Use Case Name: Đăng ký tài khoản
### Description:
> Người dùng muốn đăng ký tài khoản khách hàng để sử dụng ứng dụng.

### Actor(s): Khách hàng
### Priority: Must-have

### Trigger:
> Người dùng nhấn nút Đăng ký trên màn hình Đăng nhập hoặc màn hình Welcome để bắt đầu quá trình đăng ký tài khoản.

### Pre-Condition(s):
> Điều kiện để đăng ký tài khoản:
> - Thiết bị phải được kết nối mạng (Wifi đang bật).
> - Thông tin nhập vào các trường dữ liệu phải hợp lệ.

### Post-Condition(s):
> Sau khi đăng ký thành công, màn hình sẽ hiển thị một hộp thoại (Dialog) thông báo "Đăng ký thành công", bên dưới có nút "Đồng ý". Người dùng nhấn nút "Đồng ý" để chuyển về trang Đăng nhập.

### Basic Flow:
> Khi người dùng nhấn vào nút "Đăng ký":
>
> BF1: Chuyển sang màn hình "Đăng ký – Bước 1".
>
> BF2: Người dùng nhập thông tin vào các trường Họ và tên, Email, Số điện thoại, Địa chỉ. Các thông tin nhập vào sẽ hiển thị ngay trên các trường tương ứng.
>
> BF3: Người dùng nhấn vào dropdown chọn Ngày tháng năm sinh, một hộp thoại lịch sẽ xuất hiện, người dùng chọn ngày tháng năm mong muốn. Sau khi chọn, thông tin sẽ hiển thị trên dropdown.
>
> BF4: Sau khi nhập đầy đủ các thông tin, người dùng nhấn nút "Tiếp tục".
>
> BF5: Màn hình "Đăng ký – Bước 2" sẽ xuất hiện.
>
> BF6: Người dùng nhấn vào nút "Tải lên ảnh", màn hình sẽ hiển thị một Bottom Sheet chứa các ảnh từ thư viện để người dùng lựa chọn.
>
> BF7: Sau khi chọn ảnh avatar, ảnh này sẽ thay thế ảnh avatar mặc định.
>
> BF8: Tiếp theo, người dùng nhập mật khẩu vào trường "Mật khẩu" và nhập lại vào trường "Nhập lại mật khẩu". Mật khẩu mặc định hiển thị dưới dạng dấu *, người dùng có thể nhấn vào biểu tượng con mắt để hiển thị mật khẩu đã nhập.
>
> BF9: Cuối cùng, người dùng nhấn nút "Đăng ký" để hoàn tất quá trình đăng ký. Một hộp thoại sẽ hiển thị thông báo kết quả đăng ký thành công.

### Alternative Flow: (trống)

### Exception Flow:
> EF1: Họ và tên phải chứa từ 1 đến 254 ký tự. Nếu thất bại quay lại BF2.

---

## Bảng từ vựng chuẩn (tiếng Việt)

| Tiếng Anh | Tiếng Việt chuẩn |
|-----------|-----------------|
| Click / Tap | Nhấn |
| User | Người dùng |
| Screen / Page | Màn hình |
| Button | Nút |
| Dialog / Modal | Hộp thoại (Dialog) |
| Toast / Snackbar | Thông báo (Toast) |
| Dropdown | Dropdown |
| Input / Text field | Trường nhập liệu |
| Form | Form |
| Navigate to | Chuyển sang |
| Submit | Gửi / Hoàn tất |
| Validate | Kiểm tra tính hợp lệ |
| Error message | Thông báo lỗi |
| Success | Thành công |
| Loading | Đang xử lý |
| Redirect | Chuyển hướng về |

---

## Priority levels

| Mức độ | Ý nghĩa |
|--------|---------|
| Must-have | Bắt buộc phải có, dự án không thể thiếu |
| Should-have | Quan trọng nhưng không blocking |
| Nice-to-have | Tốt nếu có, không ảnh hưởng core |

---

## Cấu trúc UC ID theo module

Ví dụ phân nhóm:
- UC-AUTH-01, UC-AUTH-02: Module xác thực
- UC-USER-01, UC-USER-02: Module người dùng
- UC-PROD-01: Module sản phẩm
- UC-ORDER-01: Module đơn hàng
- UC-ADMIN-01: Module quản trị

---

## Checklist trước khi xuất file

- [ ] Use Case ID đúng format và không trùng
- [ ] Basic Flow mô tả đủ chi tiết từng bước
- [ ] Exception Flow bao phủ tất cả validation trong code
- [ ] Không có thông tin bịa đặt
- [ ] Văn phong nhất quán (Người dùng, Nhấn, Màn hình)
- [ ] Post-Condition mô tả rõ UI feedback
- [ ] File docx đã được validate thành công
