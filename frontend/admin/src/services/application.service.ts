import { api } from "@/services/api.service";
import type {
	ApplicationQuestionPayload,
	ApplicationQuestionRecord,
	ClubApplicationRecord,
	UpdateApplicationStatusPayload,
} from "@/types/application.type";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

const mockApplications: ClubApplicationRecord[] = [
	{
		id: 1,
		status: "pending",
		note: "Chờ ban nhân sự duyệt hồ sơ vòng đầu.",
		created_at: "2026-03-24T09:15:00",
		updated_at: "2026-03-24T10:00:00",
		created_by: 12,
		updated_by: 12,
		applicant: {
			id: 12,
			full_name: "Nguyễn Khánh Linh",
			email: "linh.nguyen@ckc.edu.vn",
			student_code: "CKC220145",
			faculty: "Công nghệ thông tin",
			major: "Kỹ thuật phần mềm",
			class_name: "CNTT K22A",
		},
		answers: [
			{
				id: 1,
				question_id: 1,
				question_label: "Bạn muốn ứng tuyển vào ban nào?",
				question_type: "select",
				answer_value: "Ban Truyền thông",
			},
			{
				id: 2,
				question_id: 2,
				question_label: "Kỹ năng nổi bật của bạn là gì?",
				question_type: "textarea",
				answer_value: "Thiết kế poster, viết nội dung social và edit video cơ bản.",
			},
			{
				id: 3,
				question_id: 3,
				question_label: "Bạn có thể tham gia sinh hoạt CLB vào thời gian nào?",
				question_type: "text",
				answer_value: "Tối thứ 3, thứ 5 và cuối tuần.",
			},
		],
	},
	{
		id: 2,
		status: "interview",
		note: "Đã liên hệ phỏng vấn, ứng viên phản hồi tích cực.",
		created_at: "2026-03-23T14:30:00",
		updated_at: "2026-03-25T08:00:00",
		created_by: 7,
		updated_by: 1,
		applicant: {
			id: 7,
			full_name: "Trần Đức Minh",
			email: "minh.tran@ckc.edu.vn",
			student_code: "CKC230087",
			faculty: "Kinh tế",
			major: "Thương mại điện tử",
			class_name: "TMDT K23",
		},
		answers: [
			{
				id: 4,
				question_id: 1,
				question_label: "Bạn muốn ứng tuyển vào ban nào?",
				question_type: "select",
				answer_value: "Ban Sự kiện",
			},
			{
				id: 5,
				question_id: 4,
				question_label: "Bạn đã từng tham gia hoạt động tập thể nào chưa?",
				question_type: "textarea",
				answer_value:
					"Từng tham gia tổ chức workshop khoa và điều phối chương trình chào tân sinh viên.",
			},
			{
				id: 6,
				question_id: 5,
				question_label: "Bạn mong muốn học được gì từ CLB?",
				question_type: "textarea",
				answer_value:
					"Rèn kỹ năng tổ chức, giao tiếp và làm việc nhóm trong môi trường thực tế.",
			},
		],
	},
	{
		id: 3,
		status: "passed",
		note: "Ứng viên phù hợp, đề xuất onboard đợt tháng 4.",
		created_at: "2026-03-21T19:45:00",
		updated_at: "2026-03-24T16:20:00",
		created_by: 15,
		updated_by: 2,
		applicant: {
			id: 15,
			full_name: "Lê Hoàng Phúc",
			email: "phuc.le@ckc.edu.vn",
			student_code: "CKC220211",
			faculty: "Công nghệ thông tin",
			major: "Hệ thống thông tin",
			class_name: "HTTT K22B",
		},
		answers: [
			{
				id: 7,
				question_id: 1,
				question_label: "Bạn muốn ứng tuyển vào ban nào?",
				question_type: "select",
				answer_value: "Ban Kỹ thuật",
			},
			{
				id: 8,
				question_id: 6,
				question_label: "Bạn đã có kinh nghiệm với công nghệ nào?",
				question_type: "textarea",
				answer_value: "React, Laravel, Git, triển khai landing page và dashboard nội bộ.",
			},
			{
				id: 9,
				question_id: 7,
				question_label: "Link sản phẩm hoặc portfolio của bạn",
				question_type: "text",
				answer_value: "github.com/hoangphuc-dev",
			},
		],
	},
];

function normalizeApplications(
	payload:
		| PaginatedResponse<ClubApplicationRecord>
		| ApiResponse<ClubApplicationRecord[]>
		| ClubApplicationRecord[],
): ClubApplicationRecord[] {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload.data)) {
		return payload.data;
	}

	return [];
}

function normalizeApplication(
	payload: ApiResponse<ClubApplicationRecord> | ClubApplicationRecord,
): ClubApplicationRecord {
	if ("data" in payload) {
		return payload.data;
	}

	return payload;
}

function normalizeQuestions(
	payload:
		| PaginatedResponse<ApplicationQuestionRecord>
		| ApiResponse<ApplicationQuestionRecord[]>
		| ApplicationQuestionRecord[],
): ApplicationQuestionRecord[] {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload.data)) {
		return payload.data;
	}

	return [];
}

function normalizeQuestion(
	payload: ApiResponse<ApplicationQuestionRecord> | ApplicationQuestionRecord,
): ApplicationQuestionRecord {
	if ("data" in payload) {
		return payload.data;
	}

	return payload;
}

const applicationService = {
	async getApplications() {
		try {
			const response = await api.get<
				PaginatedResponse<ClubApplicationRecord> | ApiResponse<ClubApplicationRecord[]>
			>("/club-applications");
			return normalizeApplications(response);
		} catch {
			return mockApplications;
		}
	},

	async updateApplicationStatus(
		applicationId: number,
		payload: UpdateApplicationStatusPayload,
	) {
		const response = await api.patch<ApiResponse<ClubApplicationRecord>, UpdateApplicationStatusPayload>(
			`/club-applications/${applicationId}/status`,
			payload,
		);

		return normalizeApplication(response);
	},

	async getQuestions() {
		const response = await api.get<
			PaginatedResponse<ApplicationQuestionRecord> | ApiResponse<ApplicationQuestionRecord[]>
		>("/application-questions");

		return normalizeQuestions(response);
	},

	async getQuestion(questionId: number) {
		const response = await api.get<ApiResponse<ApplicationQuestionRecord>>(
			`/application-questions/${questionId}`,
		);

		return normalizeQuestion(response);
	},

	async createQuestion(payload: ApplicationQuestionPayload) {
		const response = await api.post<ApiResponse<ApplicationQuestionRecord>, ApplicationQuestionPayload>(
			"/application-questions",
			payload,
		);

		return normalizeQuestion(response);
	},

	async updateQuestion(questionId: number, payload: ApplicationQuestionPayload) {
		const response = await api.put<ApiResponse<ApplicationQuestionRecord>, ApplicationQuestionPayload>(
			`/application-questions/${questionId}`,
			payload,
		);

		return normalizeQuestion(response);
	},

	async reorderQuestions(questionIds: number[]) {
		const response = await api.patch<
			ApiResponse<ApplicationQuestionRecord[]>,
			{ question_ids: number[] }
		>("/application-questions/reorder", {
			question_ids: questionIds,
		});

		return normalizeQuestions(response);
	},

	async deleteQuestion(questionId: number) {
		return api.delete<ApiResponse<{ id: number }>>(`/application-questions/${questionId}`);
	},
};

export default applicationService;
