// Thành viên Ban Chủ Nhiệm trả về từ endpoint public /club-board
export interface BoardMember {
	full_name: string;
	username: string | null;
	avatar: string | null;
	role_name: string;
	role_label: string;
}
