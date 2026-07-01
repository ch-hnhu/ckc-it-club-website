// Types cho module ProjectHub — backend: routes/api.php nhóm `/projecthub`.

export type ProjectMemberRole = "owner" | "editor" | "viewer";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectUser {
	id: number;
	full_name: string;
	username: string | null;
	avatar: string | null;
}

export interface ProjectMember extends ProjectUser {
	pivot?: {
		role: ProjectMemberRole;
		joined_at: string | null;
	};
}

export interface ProjectDepartment {
	id: number;
	name: string;
	slug: string;
}

// Tham chiếu gọn tới course/event mà board liên kết.
export interface ProjectLinkRef {
	id: number;
	title: string;
	slug: string;
}

// Tùy chọn cho picker liên kết (GET /projecthub/link-options).
export interface BoardLinkOptions {
	courses: ProjectLinkRef[];
	events: ProjectLinkRef[];
}

// Kết quả tìm user để thêm vào board.
export interface AssignableUser {
	id: number;
	full_name: string;
	username: string | null;
	email: string;
	student_code: string | null;
	avatar: string | null;
}

// Việc con (checklist) của một task.
export interface ChecklistItem {
	id: number;
	board_task_id: number;
	content: string;
	is_done: boolean;
	position: number;
}

export interface ProjectTask {
	id: number;
	board_id: number;
	column_id: number;
	title: string;
	description: string | null;
	position: number;
	priority: TaskPriority | null;
	start_date: string | null;
	due_date: string | null;
	completed_at: string | null;
	created_by: number;
	assignees?: ProjectUser[];
	checklist_items?: ChecklistItem[];
	created_at?: string;
	updated_at?: string;
}

export interface ProjectColumn {
	id: number;
	board_id: number;
	name: string;
	position: number;
	color: string | null;
	wip_limit: number | null;
	tasks?: ProjectTask[];
}

// Thẻ tóm tắt trong danh sách board.
export interface Project {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	color: string | null;
	department_id: number | null;
	course_id: number | null;
	event_id: number | null;
	is_archived: boolean;
	archived_at: string | null;
	created_by: number;
	department?: ProjectDepartment | null;
	course?: ProjectLinkRef | null;
	event?: ProjectLinkRef | null;
	columns_count?: number;
	tasks_count?: number;
	completed_tasks_count?: number;
	created_at?: string;
	updated_at?: string;
}

// Chi tiết board (giao diện Kanban).
export interface ProjectDetail extends Project {
	columns: ProjectColumn[];
	members?: ProjectMember[];
}

export interface CreateProjectInput {
	name: string;
	description?: string | null;
	color?: string | null;
	department_id?: number | null;
	course_id?: number | null;
	event_id?: number | null;
}

export interface CreateTaskInput {
	column_id: number;
	title: string;
	description?: string | null;
	priority?: TaskPriority | null;
	start_date?: string | null;
	due_date?: string | null;
	assignee_ids?: number[];
}

export interface UpdateTaskInput {
	title?: string;
	description?: string | null;
	priority?: TaskPriority | null;
	start_date?: string | null;
	due_date?: string | null;
	completed?: boolean;
	assignee_ids?: number[];
}
