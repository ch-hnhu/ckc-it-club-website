// usecase-docx-template.js
// Template tạo file Word đặc tả Use Case theo mẫu chuẩn
// Chạy: node usecase-docx-template.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageBreak, HeadingLevel
} = require('docx');
const fs = require('fs');

// ===== CẤU HÌNH MÀU SẮC =====
const HEADER_COLOR = "D5E8F0";   // Xanh nhạt cho cột tên trường
const BORDER_COLOR = "8EA9C1";   // Màu viền bảng
const TITLE_COLOR = "2E5FA3";    // Màu tiêu đề (tùy chọn)

// ===== KÍCH THƯỚC TRANG A4 =====
// A4: 11906 DXA wide, margins 2cm = 1134 DXA each side
// Content width = 11906 - 2268 = 9638 DXA
const PAGE_WIDTH = 11906;
const MARGIN = 1134; // 2cm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 9638

const COL_LABEL = 2700;               // Cột tên trường
const COL_VALUE = CONTENT_WIDTH - COL_LABEL; // Cột nội dung (~6938)

// ===== HÀM TẠO BORDER =====
function makeBorder() {
  const b = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
  return { top: b, bottom: b, left: b, right: b };
}

// ===== HÀM TẠO MỘT HÀNG BẢNG =====
function makeRow(label, value, isLarge = false) {
  // Xử lý value: có thể là string hoặc array of strings (multi-line)
  const lines = Array.isArray(value) ? value : [value];
  const valueChildren = [];

  lines.forEach((line, idx) => {
    if (line === '') {
      valueChildren.push(new Paragraph({ children: [new TextRun("")] }));
    } else {
      valueChildren.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: "Times New Roman", size: 22 })],
          spacing: { before: idx === 0 ? 0 : 60, after: 0 }
        })
      );
    }
  });

  return new TableRow({
    children: [
      // Cột trái: tên trường
      new TableCell({
        borders: makeBorder(),
        width: { size: COL_LABEL, type: WidthType.DXA },
        shading: { fill: HEADER_COLOR, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                font: "Times New Roman",
                size: 22
              })
            ]
          })
        ]
      }),
      // Cột phải: nội dung
      new TableCell({
        borders: makeBorder(),
        width: { size: COL_VALUE, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.TOP,
        children: valueChildren
      })
    ]
  });
}

// ===== HÀM TẠO BẢNG UC =====
function makeUCTable(uc) {
  // uc = { id, name, description, actors, priority, trigger, preConditions, postConditions,
  //         basicFlow, alternativeFlow, exceptionFlow }

  const basicFlowLines = Array.isArray(uc.basicFlow) ? uc.basicFlow : [uc.basicFlow];
  const altFlowLines = Array.isArray(uc.alternativeFlow) ? uc.alternativeFlow : (uc.alternativeFlow ? [uc.alternativeFlow] : ['']);
  const excFlowLines = Array.isArray(uc.exceptionFlow) ? uc.exceptionFlow : [uc.exceptionFlow];
  const preLines = Array.isArray(uc.preConditions) ? uc.preConditions : [uc.preConditions];
  const postLines = Array.isArray(uc.postConditions) ? uc.postConditions : [uc.postConditions];

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_LABEL, COL_VALUE],
    rows: [
      makeRow("Use Case ID", uc.id),
      makeRow("Use Case Name", uc.name),
      makeRow("Description", uc.description),
      makeRow("Actor(s)", uc.actors),
      makeRow("Priority", uc.priority || "Must-have"),
      makeRow("Trigger", uc.trigger),
      makeRow("Pre-Condition(s)", preLines, true),
      makeRow("Post-Condition(s)", postLines, true),
      makeRow("Basic Flow", basicFlowLines, true),
      makeRow("Alternative Flow", altFlowLines, true),
      makeRow("Exception Flow", excFlowLines, true),
    ]
  });
}

// ===== DỮ LIỆU MẪU =====
// Thay thế mảng này bằng dữ liệu thực tế từ phân tích use case
const usecases = [
  {
    id: "UC-XTKH-01",
    name: "Đăng ký tài khoản",
    description: "Người dùng muốn đăng ký tài khoản khách hàng để sử dụng ứng dụng.",
    actors: "Khách hàng",
    priority: "Must-have",
    trigger: 'Người dùng nhấn nút Đăng ký trên màn hình Đăng nhập hoặc màn hình Welcome để bắt đầu quá trình đăng ký tài khoản.',
    preConditions: [
      "Điều kiện để đăng ký tài khoản:",
      "- Thiết bị phải được kết nối mạng (Wifi đang bật).",
      "- Thông tin nhập vào các trường dữ liệu phải hợp lệ."
    ],
    postConditions: [
      'Sau khi đăng ký thành công, màn hình sẽ hiển thị một hộp thoại (Dialog) thông báo "Đăng ký thành công", bên dưới có nút "Đồng ý".',
      'Người dùng nhấn nút "Đồng ý" để chuyển về trang Đăng nhập.'
    ],
    basicFlow: [
      'Khi người dùng nhấn vào nút "Đăng ký":',
      'BF1: Chuyển sang màn hình "Đăng ký – Bước 1".',
      'BF2: Người dùng nhập thông tin vào các trường Họ và tên, Email, Số điện thoại, Địa chỉ.',
      'BF3: Người dùng nhấn vào dropdown chọn Ngày tháng năm sinh, một hộp thoại lịch sẽ xuất hiện.',
      'BF4: Sau khi nhập đầy đủ, người dùng nhấn nút "Tiếp tục".',
      'BF5: Màn hình "Đăng ký – Bước 2" sẽ xuất hiện.',
      'BF6: Người dùng nhấn nút "Tải lên ảnh" để chọn ảnh avatar từ thư viện.',
      'BF7: Người dùng nhập mật khẩu vào trường "Mật khẩu" và "Nhập lại mật khẩu".',
      'BF8: Người dùng nhấn nút "Đăng ký" để hoàn tất. Hộp thoại thông báo đăng ký thành công xuất hiện.'
    ],
    alternativeFlow: '',
    exceptionFlow: [
      'EF1: Họ và tên phải chứa từ 1 đến 254 ký tự. Nếu thất bại quay lại BF2.',
      'EF2: Email phải đúng định dạng. Nếu thất bại quay lại BF2.',
      'EF3: Mật khẩu và Nhập lại mật khẩu phải khớp nhau. Nếu thất bại quay lại BF7.'
    ]
  }
  // Thêm các UC khác vào đây...
];

// ===== TẠO DOCUMENT =====
const children = [];

usecases.forEach((uc, idx) => {
  if (idx > 0) {
    // Thêm page break trước mỗi UC (trừ UC đầu tiên)
    children.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    );
  }

  // Tiêu đề UC (tùy chọn, có thể bỏ nếu không muốn)
  // children.push(
  //   new Paragraph({
  //     children: [new TextRun({ text: `${uc.id}: ${uc.name}`, bold: true, size: 28, font: "Times New Roman" })],
  //     spacing: { before: 0, after: 200 }
  //   })
  // );

  children.push(makeUCTable(uc));
});

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: {
          width: PAGE_WIDTH,   // A4 width
          height: 16838        // A4 height
        },
        margin: {
          top: MARGIN,
          right: MARGIN,
          bottom: MARGIN,
          left: MARGIN
        }
      }
    },
    children
  }]
});

// ===== XUẤT FILE =====
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("UseCase_Output.docx", buffer);
  console.log("✅ Đã tạo file UseCase_Output.docx");
}).catch(err => {
  console.error("❌ Lỗi:", err);
});
