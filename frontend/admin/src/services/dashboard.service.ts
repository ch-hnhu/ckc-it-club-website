import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";

export interface DashboardUpcomingEvent {
	id: number;
	title: string;
	start_at: string | null;
	registrations_count: number;
	max_attendees: number | null;
}

export interface DashboardTrendPoint {
	month: string; // YYYY-MM
	new_members: number;
	posts: number;
	event_registrations: number;
}

export interface DashboardStats {
	members: { total: number };
	courses: { total: number };
	events: {
		total: number;
		published: number;
		ongoing: number;
		upcoming: DashboardUpcomingEvent[];
	};
	community: {
		posts_total: number;
		blogs_total: number;
		comments_total: number;
		resources_total: number;
	};
	queue: {
		reports_pending: number;
		resources_pending_review: number;
		applications_pending: number;
		contacts_pending: number;
	};
	learning: {
		enrollments_total: number;
		enrollments_completed: number;
		completion_rate: number;
		certificates_issued: number;
	};
	projecthub: {
		boards_active: number;
		tasks_open: number;
		tasks_completed: number;
	};
	trends: DashboardTrendPoint[];
}

const dashboardService = {
	async getStats(months: 6 | 12 = 6): Promise<DashboardStats> {
		const response = await api.get<ApiResponse<DashboardStats>>("/", { months });
		return response.data;
	},
};

export default dashboardService;
