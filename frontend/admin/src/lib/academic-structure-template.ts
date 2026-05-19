import * as XLSX from "xlsx";

const TEMPLATE_FILE_NAME = "mau-import-khoa-nganh-lop.xlsx";
const TEMPLATE_SHEET_NAME = "Mau import";

const TEMPLATE_ROWS = [
	["Tên Khoa", "Tên Ngành", "Tên Lớp"],
	["Công nghệ thông tin", "Quản trị mạng", "QTM 24"],
	["", "", ""],
	["", "", ""],
	["", "", ""],
	["", "", ""],
	["", "", ""],
];

export function downloadAcademicStructureTemplate() {
	const workbook = XLSX.utils.book_new();
	const worksheet = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);

	worksheet["!cols"] = [{ wch: 28 }, { wch: 24 }, { wch: 18 }];

	XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATE_SHEET_NAME);
	XLSX.writeFile(workbook, TEMPLATE_FILE_NAME, {
		compression: true,
	});
}
