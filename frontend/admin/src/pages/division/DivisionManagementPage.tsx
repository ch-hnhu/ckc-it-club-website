import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	BookOpen,
	CalendarRange,
	Clock3,
	HeartHandshake,
	ShieldCheck,
	Target,
	Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DivisionId = "academic" | "volunteer" | "event";

	type DivisionTheme = {
		accent: string;
		soft: string;
		panel: string;
		tabActive: string;
		tabIconActive: string;
	};

type DivisionMetric = {
	label: string;
	value: string;
};

type DivisionKpi = {
	label: string;
	value: number;
	helper: string;
};

type DivisionData = {
	id: DivisionId;
	name: string;
	shortLabel: string;
	icon: LucideIcon;
	description: string;
	status: string;
	theme: DivisionTheme;
	memberCount: number;
	openPositions: number;
	projectsRunning: number;
	meetingSchedule: string;
	responseTime: string;
	lead: string;
	viceLead: string;
	focusAreas: string[];
	currentProjects: string[];
	metrics: DivisionMetric[];
	kpis: DivisionKpi[];
};

const divisions: DivisionData[] = [
	{
		id: "academic",
		name: "Ban Học thuật",
		shortLabel: "Học thuật",
		icon: BookOpen,
		description:
			"Phụ trách học liệu, workshop chuyên môn, mentoring nội bộ và chuẩn hóa đầu ra kỹ thuật cho thành viên.",
		status: "Ổn định, cần bổ sung mentor",
		theme: {
			accent: "bg-amber-500",
			soft: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
			panel: "from-amber-500/20 via-background to-background",
			tabActive:
				"data-[state=active]:border-amber-300/80 data-[state=active]:bg-amber-500/10",
			tabIconActive:
				"group-data-[state=active]:border-amber-500 group-data-[state=active]:bg-amber-500 group-data-[state=active]:text-white",
		},
		memberCount: 14,
		openPositions: 2,
		projectsRunning: 4,
		meetingSchedule: "19:00 Thứ 3 hàng tuần",
		responseTime: "Cập nhật học liệu mỗi 48h",
		lead: "Nguyễn Minh Nhật",
		viceLead: "Trần Khánh Ly",
		focusAreas: [
			"Lộ trình frontend và backend cho tân thành viên",
			"Workshop Git, Laravel, React theo từng giai đoạn",
			"Review bài tập và theo dõi năng lực theo sprint",
		],
		currentProjects: [
			"Bootcamp React cho khóa mới",
			"Chuẩn hóa ngân hàng bài tập thuật toán",
			"Mentor 1-1 cho nhóm học viên thử việc",
		],
		metrics: [
			{ label: "Tỷ lệ hoàn thành lộ trình", value: "82%" },
			{ label: "Workshop tháng này", value: "06 buổi" },
			{ label: "Mentor đang hoạt động", value: "08 người" },
		],
		kpis: [
			{
				label: "Đào tạo nội bộ",
				value: 82,
				helper: "Đạt 82/100 tiến độ chương trình quý này",
			},
			{
				label: "Tài liệu hóa",
				value: 74,
				helper: "Cần hoàn thiện thêm guideline review dự án",
			},
			{
				label: "Phản hồi thành viên",
				value: 91,
				helper: "Thời gian hỗ trợ đang giữ ở mức tốt",
			},
		],
	},
	{
		id: "volunteer",
		name: "Ban Tình nguyện",
		shortLabel: "Tình nguyện",
		icon: HeartHandshake,
		description:
			"Điều phối hoạt động cộng đồng, kết nối đối tác xã hội và vận hành các chiến dịch hỗ trợ sinh viên.",
		status: "Cao điểm chiến dịch hè",
		theme: {
			accent: "bg-emerald-500",
			soft: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
			panel: "from-emerald-500/20 via-background to-background",
			tabActive:
				"data-[state=active]:border-emerald-300/80 data-[state=active]:bg-emerald-500/10",
			tabIconActive:
				"group-data-[state=active]:border-emerald-500 group-data-[state=active]:bg-emerald-500 group-data-[state=active]:text-white",
		},
		memberCount: 18,
		openPositions: 3,
		projectsRunning: 5,
		meetingSchedule: "17:30 Thứ 5 hàng tuần",
		responseTime: "Xác nhận tình nguyện viên trong 24h",
		lead: "Lê Thu Hà",
		viceLead: "Phạm Gia Hưng",
		focusAreas: [
			"Tổ chức chiến dịch thiện nguyện theo học kỳ",
			"Quản lý đăng ký, phân ca và hậu cần hiện trường",
			"Chăm sóc đối tác và tổng hợp báo cáo tác động",
		],
		currentProjects: [
			"Chương trình Tiếp sức mùa thi",
			"Quỹ học cụ cho học sinh vùng ven",
			"Ngày hội hiến máu phối hợp Đoàn trường",
		],
		metrics: [
			{ label: "Tình nguyện viên hoạt động", value: "42 người" },
			{ label: "Chiến dịch đang mở", value: "03 chiến dịch" },
			{ label: "Đối tác xã hội", value: "09 đơn vị" },
		],
		kpis: [
			{
				label: "Phủ lịch tình nguyện",
				value: 88,
				helper: "Hầu hết ca trực đã đủ người, còn thiếu cuối tuần",
			},
			{
				label: "Điều phối hậu cần",
				value: 79,
				helper: "Cần chốt thêm kho vật phẩm cho chiến dịch hè",
			},
			{
				label: "Báo cáo tác động",
				value: 93,
				helper: "Báo cáo sau sự kiện được nộp đúng hạn",
			},
		],
	},
	{
		id: "event",
		name: "Ban Sự kiện",
		shortLabel: "Sự kiện",
		icon: CalendarRange,
		description:
			"Chịu trách nhiệm concept, timeline, truyền thông nội bộ và phối hợp triển khai các chương trình lớn của CLB.",
		status: "Đang chuẩn bị demo day",
		theme: {
			accent: "bg-sky-500",
			soft: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
			panel: "from-sky-500/20 via-background to-background",
			tabActive:
				"data-[state=active]:border-sky-300/80 data-[state=active]:bg-sky-500/10",
			tabIconActive:
				"group-data-[state=active]:border-sky-500 group-data-[state=active]:bg-sky-500 group-data-[state=active]:text-white",
		},
		memberCount: 16,
		openPositions: 1,
		projectsRunning: 6,
		meetingSchedule: "19:30 Thứ 6 hàng tuần",
		responseTime: "Khóa timeline trước sự kiện 7 ngày",
		lead: "Võ Quốc Đạt",
		viceLead: "Đặng Bảo Nghi",
		focusAreas: [
			"Thiết kế format sự kiện, kịch bản sân khấu và line-up",
			"Phân công production checklist và phối hợp liên ban",
			"Quản lý timeline trước, trong và sau sự kiện",
		],
		currentProjects: [
			"Demo Day dự án thành viên",
			"Talkshow định hướng nghề nghiệp ngành IT",
			"Mini game onboarding cho tân thành viên",
		],
		metrics: [
			{ label: "Sự kiện quý này", value: "08 sự kiện" },
			{ label: "Checklist đang mở", value: "19 đầu việc" },
			{ label: "Mốc deadline gần nhất", value: "5 ngày" },
		],
		kpis: [
			{
				label: "Bám timeline",
				value: 86,
				helper: "Tiến độ ổn, cần chốt MC và media kit",
			},
			{
				label: "Phối hợp liên ban",
				value: 90,
				helper: "Nhịp phối hợp với học thuật và truyền thông tốt",
			},
			{
				label: "Mức sẵn sàng sân khấu",
				value: 68,
				helper: "Còn thiếu phương án dự phòng thiết bị",
			},
		],
	},
];

const breadcrumbItems = [
	{ title: "Dashboard", link: "/" },
	{ title: "Quản lý CLB" },
	{ title: "Các ban" },
];

function DivisionManagementPage() {
	useBreadcrumb(breadcrumbItems);

	const totalMembers = divisions.reduce((sum, division) => sum + division.memberCount, 0);
	const totalOpenPositions = divisions.reduce(
		(sum, division) => sum + division.openPositions,
		0,
	);
	const totalProjects = divisions.reduce(
		(sum, division) => sum + division.projectsRunning,
		0,
	);

	return (
		<div className='min-h-full bg-muted/30'>
			<div className='space-y-6 p-4 md:p-6 lg:p-8'>
				<Card className='overflow-hidden border-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl'>
					<CardContent className='grid gap-6 p-6 md:p-8 xl:grid-cols-[1.5fr_0.8fr]'>
						<div className='space-y-5'>
							<Badge className='bg-white/10 text-white hover:bg-white/10'>
								Quản lý vận hành các ban
							</Badge>
							<div className='space-y-3'>
								<h1 className='max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl'>
									Trang điều phối 3 ban trọng tâm của CKC IT Club
								</h1>
								<p className='max-w-2xl text-sm leading-6 text-slate-300 md:text-base'>
									Theo dõi nhanh nhân sự, tiến độ và trọng tâm hoạt động của
									ba ban: học thuật, tình nguyện và sự kiện trong cùng một màn
									hình quản trị.
								</p>
							</div>
							<div className='flex flex-wrap gap-3'>
								<Button asChild variant='secondary' size='lg'>
									<Link to='/requests'>
										Xem hồ sơ ứng tuyển
										<ArrowRight />
									</Link>
								</Button>
								<Button
									asChild
									variant='outline'
									size='lg'
									className='border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'>
									<Link to='/questions'>Quản lý câu hỏi tuyển thành viên</Link>
								</Button>
							</div>
						</div>

						<div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1'>
							<div className='rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur'>
								<div className='text-sm text-slate-300'>Tổng thành viên nòng cốt</div>
								<div className='mt-2 text-3xl font-semibold'>{totalMembers}</div>
								<div className='mt-1 text-xs text-slate-400'>
									Phân bổ đều giữa 3 ban vận hành chính
								</div>
							</div>
							<div className='rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur'>
								<div className='text-sm text-slate-300'>Vị trí đang cần bổ sung</div>
								<div className='mt-2 text-3xl font-semibold'>
									{totalOpenPositions}
								</div>
								<div className='mt-1 text-xs text-slate-400'>
									Ưu tiên mentor học thuật và điều phối tình nguyện
								</div>
							</div>
							<div className='rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur'>
								<div className='text-sm text-slate-300'>Đầu việc đang chạy</div>
								<div className='mt-2 text-3xl font-semibold'>{totalProjects}</div>
								<div className='mt-1 text-xs text-slate-400'>
									Bao gồm chương trình nội bộ và hoạt động cộng đồng
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className='grid gap-4 xl:grid-cols-3'>
					{divisions.map((division) => {
						const Icon = division.icon;

						return (
							<Card
								key={division.id}
								className={`overflow-hidden border-border/70 bg-gradient-to-br ${division.theme.panel}`}>
								<CardHeader className='space-y-4'>
									<div className='flex items-start justify-between gap-3'>
										<div className='space-y-2'>
											<Badge className={division.theme.soft}>{division.status}</Badge>
											<CardTitle className='text-xl'>{division.name}</CardTitle>
										</div>
										<div
											className={`flex h-11 w-11 items-center justify-center rounded-2xl ${division.theme.accent} text-white shadow-lg`}>
											<Icon className='h-5 w-5' />
										</div>
									</div>
									<CardDescription className='text-sm leading-6 text-foreground/80'>
										{division.description}
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-5'>
									<div className='grid grid-cols-3 gap-3'>
										{division.metrics.map((metric) => (
											<div
												key={metric.label}
												className='rounded-2xl border bg-background/80 p-3 shadow-sm'>
												<div className='text-xs text-muted-foreground'>
													{metric.label}
												</div>
												<div className='mt-2 text-lg font-semibold'>
													{metric.value}
												</div>
											</div>
										))}
									</div>

									<div className='space-y-3 rounded-2xl border bg-background/80 p-4 shadow-sm'>
										<div className='flex items-center justify-between text-sm'>
											<span className='flex items-center gap-2 text-muted-foreground'>
												<Users className='h-4 w-4' />
												Nhân sự hiện tại
											</span>
											<span className='font-medium text-foreground'>
												{division.memberCount} thành viên
											</span>
										</div>
										<div className='flex items-center justify-between text-sm'>
											<span className='flex items-center gap-2 text-muted-foreground'>
												<Clock3 className='h-4 w-4' />
												Lịch họp
											</span>
											<span className='font-medium text-foreground'>
												{division.meetingSchedule}
											</span>
										</div>
										<div className='flex items-center justify-between text-sm'>
											<span className='flex items-center gap-2 text-muted-foreground'>
												<Target className='h-4 w-4' />
												Vị trí mở
											</span>
											<span className='font-medium text-foreground'>
												{division.openPositions} vị trí
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				<Tabs defaultValue='academic' className='space-y-4'>
					<TabsList className='grid h-auto w-full grid-cols-1 gap-2 rounded-3xl border bg-background/90 p-2 shadow-sm md:grid-cols-3'>
						{divisions.map((division) => {
							const Icon = division.icon;

							return (
							<TabsTrigger
								key={division.id}
								value={division.id}
								className={cn(
									"group h-auto rounded-2xl border border-transparent px-4 py-4 text-left transition-all duration-200",
									"data-[state=active]:-translate-y-0.5 data-[state=active]:shadow-lg",
									"data-[state=active]:text-foreground",
									division.theme.tabActive,
								)}>
								<div className='flex items-center gap-3'>
									<div
										className={cn(
											"flex h-11 w-11 items-center justify-center rounded-2xl border bg-muted/60 text-muted-foreground transition-all duration-200",
											division.theme.tabIconActive,
										)}>
										<Icon className='h-5 w-5' />
									</div>
									<div className='flex min-w-0 flex-1 flex-col items-start'>
										<span className='text-base font-semibold'>
											{division.shortLabel}
										</span>
										<span className='text-xs text-muted-foreground group-data-[state=active]:text-foreground/70'>
											{division.memberCount} thành viên nòng cốt
										</span>
									</div>
									<div className='hidden h-2.5 w-2.5 rounded-full bg-transparent transition-all duration-200 group-data-[state=active]:bg-current md:block' />
								</div>
							</TabsTrigger>
							);
						})}
					</TabsList>

					{divisions.map((division) => (
						<TabsContent key={division.id} value={division.id} className='space-y-4'>
							<div className='grid gap-4 xl:grid-cols-[1.3fr_0.9fr]'>
								<Card className='border-border/70'>
									<CardHeader>
										<div className='flex flex-wrap items-start justify-between gap-3'>
											<div className='space-y-2'>
												<Badge className={division.theme.soft}>
													Chi tiết vận hành
												</Badge>
												<CardTitle className='text-2xl'>
													{division.name}
												</CardTitle>
												<CardDescription className='max-w-2xl text-sm leading-6'>
													{division.description}
												</CardDescription>
											</div>
											<div className='rounded-2xl border bg-muted/40 px-4 py-3 text-sm'>
												<div className='text-muted-foreground'>Phản hồi vận hành</div>
												<div className='mt-1 font-medium'>
													{division.responseTime}
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent className='grid gap-4 lg:grid-cols-2'>
										<div className='rounded-2xl border bg-muted/25 p-5'>
											<div className='flex items-center gap-2 text-sm text-muted-foreground'>
												<ShieldCheck className='h-4 w-4' />
												Điều hành
											</div>
											<div className='mt-4 space-y-4'>
												<div>
													<div className='text-sm text-muted-foreground'>
														Trưởng ban
													</div>
													<div className='text-lg font-semibold'>
														{division.lead}
													</div>
												</div>
												<div>
													<div className='text-sm text-muted-foreground'>
														Phó ban
													</div>
													<div className='text-lg font-semibold'>
														{division.viceLead}
													</div>
												</div>
												<div>
													<div className='text-sm text-muted-foreground'>
														Dự án đang chạy
													</div>
													<div className='text-lg font-semibold'>
														{division.projectsRunning} đầu việc trọng tâm
													</div>
												</div>
											</div>
										</div>

										<div className='rounded-2xl border bg-muted/25 p-5'>
											<div className='flex items-center gap-2 text-sm text-muted-foreground'>
												<Target className='h-4 w-4' />
												Trọng tâm của ban
											</div>
											<div className='mt-4 space-y-3'>
												{division.focusAreas.map((area) => (
													<div
														key={area}
														className='rounded-xl border bg-background px-4 py-3 text-sm leading-6'>
														{area}
													</div>
												))}
											</div>
										</div>
									</CardContent>
								</Card>

								<div className='space-y-4'>
									<Card className='border-border/70'>
										<CardHeader>
											<CardTitle className='text-lg'>Chỉ số theo dõi</CardTitle>
											<CardDescription>
												Theo dõi tiến độ vận hành trong tháng hiện tại.
											</CardDescription>
										</CardHeader>
										<CardContent className='space-y-5'>
											{division.kpis.map((kpi) => (
												<div key={kpi.label} className='space-y-2'>
													<div className='flex items-center justify-between gap-3 text-sm'>
														<span className='font-medium'>{kpi.label}</span>
														<span className='text-muted-foreground'>
															{kpi.value}%
														</span>
													</div>
													<Progress value={kpi.value} />
													<p className='text-xs leading-5 text-muted-foreground'>
														{kpi.helper}
													</p>
												</div>
											))}
										</CardContent>
									</Card>

									<Card className='border-border/70'>
										<CardHeader>
											<CardTitle className='text-lg'>
												Công việc ưu tiên
											</CardTitle>
											<CardDescription>
												Danh sách đầu việc đang cần theo dõi sát.
											</CardDescription>
										</CardHeader>
										<CardContent className='space-y-3'>
											{division.currentProjects.map((project, index) => (
												<div
													key={project}
													className='flex items-start gap-3 rounded-2xl border bg-muted/20 px-4 py-3'>
													<div
														className={`mt-0.5 h-2.5 w-2.5 rounded-full ${division.theme.accent}`}
													/>
													<div className='space-y-1'>
														<div className='text-sm font-medium'>
															{index + 1}. {project}
														</div>
														<div className='text-xs text-muted-foreground'>
															Cần cập nhật checkpoint trong buổi họp gần nhất.
														</div>
													</div>
												</div>
											))}
										</CardContent>
									</Card>
								</div>
							</div>
						</TabsContent>
					))}
				</Tabs>

				<div className='grid gap-4 lg:grid-cols-3'>
					<Card className='border-border/70'>
						<CardHeader>
							<CardTitle className='text-lg'>Nhân sự cần ưu tiên</CardTitle>
							<CardDescription>
								Phân bổ tuyển thêm cho từng ban trong đợt tới.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div className='flex items-center justify-between rounded-xl border px-4 py-3'>
								<span>Ban Học thuật</span>
								<Badge variant='outline'>02 mentor</Badge>
							</div>
							<div className='flex items-center justify-between rounded-xl border px-4 py-3'>
								<span>Ban Tình nguyện</span>
								<Badge variant='outline'>03 điều phối viên</Badge>
							</div>
							<div className='flex items-center justify-between rounded-xl border px-4 py-3'>
								<span>Ban Sự kiện</span>
								<Badge variant='outline'>01 production lead</Badge>
							</div>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardHeader>
							<CardTitle className='text-lg'>Lịch phối hợp liên ban</CardTitle>
							<CardDescription>
								Các mốc cần đồng bộ giữa ba ban trong tháng này.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div className='rounded-xl border px-4 py-3'>
								<div className='flex items-center gap-2 font-medium'>
									<CalendarRange className='h-4 w-4' />
									Tuần 1
								</div>
								<p className='mt-2 text-muted-foreground'>
									Chốt nhu cầu tuyển bổ sung và cập nhật câu hỏi ứng tuyển.
								</p>
							</div>
							<div className='rounded-xl border px-4 py-3'>
								<div className='flex items-center gap-2 font-medium'>
									<CalendarRange className='h-4 w-4' />
									Tuần 2
								</div>
								<p className='mt-2 text-muted-foreground'>
									Đồng bộ lịch workshop, chiến dịch cộng đồng và sự kiện nội bộ.
								</p>
							</div>
							<div className='rounded-xl border px-4 py-3'>
								<div className='flex items-center gap-2 font-medium'>
									<CalendarRange className='h-4 w-4' />
									Tuần 4
								</div>
								<p className='mt-2 text-muted-foreground'>
									Tổng kết KPI, điều chỉnh nhân sự và khóa kế hoạch tháng sau.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardHeader>
							<CardTitle className='text-lg'>Gợi ý vận hành</CardTitle>
							<CardDescription>
								Những điểm nên theo dõi để giảm nghẽn trong quá trình điều phối.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm text-muted-foreground'>
							<div className='rounded-xl border px-4 py-3 leading-6'>
								Thiết lập checklist bàn giao sau mỗi sự kiện để ban học thuật và
								tình nguyện cùng tái sử dụng tài nguyên.
							</div>
							<div className='rounded-xl border px-4 py-3 leading-6'>
								Dùng chung một đầu mối cập nhật tiến độ hàng tuần để hạn chế lệch
								thông tin giữa trưởng ban.
							</div>
							<div className='rounded-xl border px-4 py-3 leading-6'>
								Gắn nhu cầu tuyển người với đúng dự án đang thiếu thay vì tuyển
								tràn cho toàn CLB.
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default DivisionManagementPage;
