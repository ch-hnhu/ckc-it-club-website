import { type FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ExternalLink,
	Eye,
	FileText,
	Hash,
	Info,
	Loader2,
	MoreHorizontal,
	Plus,
	SquarePen,
	Tag,
	ToggleLeft,
	Trash2,
	Type,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import clubInformationService from "@/services/club-information.service";
import type { ApiErrorResponse } from "@/types/api.types";
import {
	CLUB_INFORMATION_TYPES,
	type ClubInformation,
	type ClubInformationValue,
} from "@/types/club-information";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CompactBadgeList, type CompactBadgeItem } from "@/components/ui/compact-badge-list";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ValSortKey =
	| "id"
	| "value"
	| "alt"
	| "link"
	| "position"
	| "is_active"
	| "created_at"
	| "updated_at";

type ValueFormState = {
	value: string;
	link: string;
	alt: string;
	position: string;
	is_active: boolean;
};

type ValueFieldErrors = Partial<Record<keyof ValueFormState, string>>;

const getInitialValueForm = (): ValueFormState => ({
	value: "",
	link: "",
	alt: "",
	position: "",
	is_active: true,
});

const getValueFormFromRecord = (record: ClubInformationValue): ValueFormState => ({
	value: record.value ?? "",
	link: record.link ?? "",
	alt: record.alt ?? "",
	position: record.position === null || record.position === undefined ? "" : String(record.position),
	is_active: record.is_active !== false,
});

type InfoFormState = {
	label: string;
	value: string;
	slug: string;
	type: string;
	description: string;
	is_active: boolean;
};

type InfoFieldErrors = Partial<Record<keyof InfoFormState, string>>;

const getInfoFormFromRecord = (record: ClubInformation): InfoFormState => ({
	label: record.label ?? "",
	value: record.value ?? "",
	slug: record.slug ?? "",
	type: record.type ?? "",
	description: record.description ?? "",
	is_active: record.is_active !== false,
});

function formatDate(dateString: string | null) {
	return dateString?.trim() || "--";
}

function getErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
		if (responseMessage) return responseMessage;
	}
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-1'>
			<p className='text-sm font-medium text-muted-foreground'>{label}</p>
			<div className='text-sm font-semibold break-words'>{value}</div>
		</div>
	);
}

function getStatusBadgeItems(isActive?: boolean): CompactBadgeItem[] {
	return [
		{
			key: isActive === false ? "inactive" : "active",
			label: isActive === false ? "Tạm ẩn" : "Đang dùng",
			className:
				isActive === false
					? "border-muted-foreground/20 bg-muted text-muted-foreground hover:bg-muted"
					: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
		},
	];
}

function getTypeBadgeItems(type: string | null): CompactBadgeItem[] {
	if (!type) return [];

	return [
		{
			key: type,
			label: type,
			className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
		},
	];
}

function getSlugBadgeItems(slug: string): CompactBadgeItem[] {
	if (!slug) return [];

	return [
		{
			key: slug,
			label: slug,
			className:
				"border-muted-foreground/20 bg-muted font-mono text-muted-foreground hover:bg-muted",
		},
	];
}

function ClubInformationDetailPage() {
	const { id } = useParams();
	const [info, setInfo] = useState<ClubInformation | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [valSearch, setValSearch] = useState("");
	const [valDebouncedSearch, setValDebouncedSearch] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);
	const [isAddValueDialogOpen, setIsAddValueDialogOpen] = useState(false);
	const [valueForm, setValueForm] = useState<ValueFormState>(getInitialValueForm);
	const [valueFieldErrors, setValueFieldErrors] = useState<ValueFieldErrors>({});
	const [valueSubmitting, setValueSubmitting] = useState(false);
	const [selectedValue, setSelectedValue] = useState<ClubInformationValue | null>(null);
	const [valuePendingDelete, setValuePendingDelete] = useState<ClubInformationValue | null>(
		null,
	);
	const [valueDeleting, setValueDeleting] = useState(false);
	const [isEditingValue, setIsEditingValue] = useState(false);
	const [detailValueForm, setDetailValueForm] = useState<ValueFormState>(getInitialValueForm);
	const [detailValueFieldErrors, setDetailValueFieldErrors] = useState<ValueFieldErrors>({});
	const [detailValueSubmitting, setDetailValueSubmitting] = useState(false);
	const [isEditingInfo, setIsEditingInfo] = useState(false);
	const [infoForm, setInfoForm] = useState<InfoFormState | null>(null);
	const [infoFieldErrors, setInfoFieldErrors] = useState<InfoFieldErrors>({});
	const [infoSubmitting, setInfoSubmitting] = useState(false);

	const [valSortConfig, setValSortConfig] = useState<{
		key: ValSortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: null, order: null });
	const [valCurrentPage, setValCurrentPage] = useState(1);
	const [valPerPage, setValPerPage] = useState(10);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý thông tin CLB", link: "/club-informations" },
			{ title: info?.label?.trim() || "Chi tiết cấu hình" },
		],
		[info?.label],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const handler = window.setTimeout(() => {
			setValDebouncedSearch(valSearch.trim());
		}, 500);

		return () => window.clearTimeout(handler);
	}, [valSearch]);

	useEffect(() => {
		setValCurrentPage(1);
	}, [valDebouncedSearch]);

	useEffect(() => {
		let mounted = true;

		const fetchInfo = async () => {
			if (!id) {
				setLoading(false);
				setError("Thiếu mã cấu hình.");
				return;
			}

			try {
				const response = await clubInformationService.getClubInformation(Number(id), {
					search: valDebouncedSearch || undefined,
					sort: valSortConfig.key || undefined,
					order: valSortConfig.order || undefined,
				});
				if (!mounted) return;
				setInfo(response.data);
				setError(null);
			} catch (fetchError) {
				if (!mounted) return;
				setInfo(null);
				setError(getErrorMessage(fetchError, "Không thể tải chi tiết cấu hình."));
			} finally {
				if (mounted) setLoading(false);
			}
		};

		void fetchInfo();

		return () => {
			mounted = false;
		};
	}, [id, valDebouncedSearch, valSortConfig, refreshKey]);

	const values = useMemo(() => info?.club_information_values ?? [], [info]);
	const sortedValues = values;

	const isImageType = info?.type === "image" || info?.type === "banner";
	const isBannerType = info?.type === "banner";
	const isBooleanType = info?.type === "boolean";
	const tableColSpan = 7 + (isImageType ? 1 : 0) + (isBannerType ? 2 : 0) - (isBooleanType ? 1 : 0);
	const valueColLabel = isImageType
		? "Ảnh"
		: info?.type === "url"
			? "URL"
			: info?.type === "boolean"
				? "Giá trị"
				: "Nội dung";
	const selectedValuePreview = isEditingValue
		? detailValueForm.value
		: selectedValue?.value ?? "";
	const selectedAltPreview = isEditingValue ? detailValueForm.alt : selectedValue?.alt ?? "";
	const selectedLinkPreview = isEditingValue ? detailValueForm.link : selectedValue?.link ?? "";

	const valLastPage = Math.max(1, Math.ceil(sortedValues.length / valPerPage));

	const paginatedValues = useMemo(() => {
		const start = (valCurrentPage - 1) * valPerPage;
		return sortedValues.slice(start, start + valPerPage);
	}, [sortedValues, valCurrentPage, valPerPage]);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		paginatedValues.map((v) => v.id),
	);

	const handleValSort = (key: ValSortKey) => {
		setValCurrentPage(1);
		setValSortConfig((prev) => {
			if (prev.key !== key) return { key, order: "asc" };
			if (prev.order === "asc") return { key, order: "desc" };
			if (prev.order === "desc") return { key: null, order: null };
			return { key, order: "asc" };
		});
	};

	const getValSortIcon = (key: ValSortKey) => {
		if (valSortConfig.key !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
		if (valSortConfig.order === "asc") return <ArrowUp className='ml-2 h-4 w-4' />;
		if (valSortConfig.order === "desc") return <ArrowDown className='ml-2 h-4 w-4' />;
		return <ArrowUpDown className='ml-2 h-4 w-4' />;
	};

	const openValueDetail = (value: ClubInformationValue) => {
		setSelectedValue(value);
		setDetailValueForm(getValueFormFromRecord(value));
		setDetailValueFieldErrors({});
		setIsEditingValue(false);
	};

	const closeValueDetail = () => {
		if (detailValueSubmitting) return;
		setSelectedValue(null);
		setDetailValueForm(getInitialValueForm());
		setDetailValueFieldErrors({});
		setIsEditingValue(false);
	};

	const setDetailValueField = <K extends keyof ValueFormState>(
		key: K,
		value: ValueFormState[K],
	) => {
		setDetailValueForm((prev) => ({ ...prev, [key]: value }));
		setDetailValueFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleUpdateValueSubmit = async () => {
		if (!selectedValue) return;

		const clubInformationId = Number(id);
		if (!Number.isFinite(clubInformationId)) {
			toast.error("Thiếu mã cấu hình.", { position: "top-right" });
			return;
		}

		if (!detailValueForm.value.trim()) {
			setDetailValueFieldErrors({ value: "Vui lòng nhập giá trị." });
			return;
		}

		const positionNum = detailValueForm.position.trim()
			? Number(detailValueForm.position)
			: undefined;

		try {
			setDetailValueSubmitting(true);
			const response = await clubInformationService.updateClubInformationValue(
				clubInformationId,
				selectedValue.id,
				{
					value: detailValueForm.value.trim(),
					link: detailValueForm.link.trim() || undefined,
					alt: detailValueForm.alt.trim() || undefined,
					position:
						positionNum !== undefined && !Number.isNaN(positionNum)
							? positionNum
							: undefined,
					is_active: detailValueForm.is_active,
				},
			);

			setSelectedValue(response.data);
			setDetailValueForm(getValueFormFromRecord(response.data));
			setDetailValueFieldErrors({});
			setIsEditingValue(false);
			setInfo((prev) =>
				prev
					? {
							...prev,
							club_information_values: (prev.club_information_values ?? []).map(
								(item) => (item.id === response.data.id ? response.data : item),
							),
						}
					: prev,
			);
			setRefreshKey((prev) => prev + 1);
			toast.success(response.message ?? "Cập nhật giá trị cấu hình thành công.", {
				position: "top-right",
			});
		} catch (submitError) {
			if (axios.isAxiosError<ApiErrorResponse>(submitError)) {
				const responseData = submitError.response?.data;
				const serverErrors = responseData?.errors;

				if (serverErrors) {
					setDetailValueFieldErrors({
						value: serverErrors.value?.[0],
						link: serverErrors.link?.[0],
						alt: serverErrors.alt?.[0],
						position: serverErrors.position?.[0],
						is_active: serverErrors.is_active?.[0],
					});
				}

				toast.error(responseData?.message ?? "Không thể cập nhật giá trị cấu hình.", {
					position: "top-right",
				});
				return;
			}

			toast.error(getErrorMessage(submitError, "Không thể cập nhật giá trị cấu hình."), {
				position: "top-right",
			});
		} finally {
			setDetailValueSubmitting(false);
		}
	};

	const handleDeleteValueDialogOpenChange = (open: boolean) => {
		if (!open && valueDeleting) return;
		if (!open) setValuePendingDelete(null);
	};

	const handleDeleteValueSubmit = async () => {
		if (!valuePendingDelete) return;

		const clubInformationId = Number(id);
		if (!Number.isFinite(clubInformationId)) {
			toast.error("Thiếu mã cấu hình.", { position: "top-right" });
			return;
		}

		try {
			setValueDeleting(true);
			const response = await clubInformationService.deleteClubInformationValue(
				clubInformationId,
				valuePendingDelete.id,
			);

			setInfo((prev) =>
				prev
					? {
							...prev,
							club_information_values: (prev.club_information_values ?? []).filter(
								(item) => item.id !== valuePendingDelete.id,
							),
						}
					: prev,
			);
			if (selectedValue?.id === valuePendingDelete.id) closeValueDetail();
			setValCurrentPage((prev) =>
				Math.min(prev, Math.max(1, Math.ceil((sortedValues.length - 1) / valPerPage))),
			);
			setValuePendingDelete(null);
			setRefreshKey((prev) => prev + 1);
			toast.success(response.message ?? "Xóa giá trị cấu hình thành công.", {
				position: "top-right",
			});
		} catch (deleteError) {
			if (axios.isAxiosError<ApiErrorResponse>(deleteError)) {
				const responseData = deleteError.response?.data;
				const serverMessage =
					Object.values(responseData?.errors ?? {}).flat()[0] ??
					responseData?.message ??
					"Không thể xóa giá trị cấu hình.";

				toast.error(serverMessage, { position: "top-right" });
				return;
			}

			toast.error(getErrorMessage(deleteError, "Không thể xóa giá trị cấu hình."), {
				position: "top-right",
			});
		} finally {
			setValueDeleting(false);
		}
	};

	const startEditInfo = () => {
		if (!info) return;
		setInfoForm(getInfoFormFromRecord(info));
		setInfoFieldErrors({});
		setIsEditingInfo(true);
	};

	const cancelEditInfo = () => {
		if (infoSubmitting) return;
		setInfoForm(null);
		setInfoFieldErrors({});
		setIsEditingInfo(false);
	};

	const setInfoField = <K extends keyof InfoFormState>(key: K, value: InfoFormState[K]) => {
		setInfoForm((prev) => (prev ? { ...prev, [key]: value } : prev));
		setInfoFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const validateInfoForm = (form: InfoFormState) => {
		const errors: InfoFieldErrors = {};
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên cấu hình.";
		if (!form.value.trim()) errors.value = "Vui lòng nhập giá trị key.";
		if (!form.slug.trim()) errors.slug = "Vui lòng nhập slug.";
		if (!form.type) errors.type = "Vui lòng chọn kiểu dữ liệu.";
		setInfoFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleUpdateInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!infoForm) return;

		const clubInformationId = Number(id);
		if (!Number.isFinite(clubInformationId)) {
			toast.error("Thiếu mã cấu hình.", { position: "top-right" });
			return;
		}

		if (!validateInfoForm(infoForm)) return;

		try {
			setInfoSubmitting(true);
			const response = await clubInformationService.updateClubInformation(clubInformationId, {
				label: infoForm.label.trim(),
				value: infoForm.value.trim(),
				slug: infoForm.slug.trim(),
				type: infoForm.type,
				description: infoForm.description.trim() || undefined,
				is_active: infoForm.is_active,
			});

			setInfo(response.data);
			setInfoForm(null);
			setInfoFieldErrors({});
			setIsEditingInfo(false);
			toast.success(response.message ?? "Cập nhật cấu hình thành công.", {
				position: "top-right",
			});
		} catch (submitError) {
			if (axios.isAxiosError<ApiErrorResponse>(submitError)) {
				const responseData = submitError.response?.data;
				const serverErrors = responseData?.errors;

				if (serverErrors) {
					const mapped: InfoFieldErrors = {};
					for (const [key, messages] of Object.entries(serverErrors)) {
						mapped[key as keyof InfoFormState] = Array.isArray(messages)
							? messages[0]
							: String(messages);
					}
					setInfoFieldErrors(mapped);
				}

				toast.error(responseData?.message ?? "Không thể cập nhật cấu hình.", {
					position: "top-right",
				});
				return;
			}

			toast.error(getErrorMessage(submitError, "Không thể cập nhật cấu hình."), {
				position: "top-right",
			});
		} finally {
			setInfoSubmitting(false);
		}
	};

	const handleAddValueDialogOpenChange = (open: boolean) => {
		if (!open && valueSubmitting) return;

		if (!open) {
			setValueForm(getInitialValueForm());
			setValueFieldErrors({});
		}

		setIsAddValueDialogOpen(open);
	};

	const handleAddValueSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const clubInformationId = Number(id);

		if (!valueForm.value.trim()) {
			setValueFieldErrors({ value: "Vui lòng nhập giá trị." });
			return;
		}

		if (!Number.isFinite(clubInformationId)) {
			toast.error("Thiếu mã cấu hình.", { position: "top-right" });
			return;
		}

		const positionNum = valueForm.position.trim() ? Number(valueForm.position) : undefined;

		try {
			setValueSubmitting(true);
			const response = await clubInformationService.createClubInformationValue(
				clubInformationId,
				{
					value: valueForm.value.trim(),
					link: valueForm.link.trim() || undefined,
					alt: valueForm.alt.trim() || undefined,
					position:
						positionNum !== undefined && !Number.isNaN(positionNum)
							? positionNum
							: undefined,
					is_active: valueForm.is_active,
				},
			);

			toast.success(response.message ?? "Tạo giá trị cấu hình thành công.", {
				position: "top-right",
			});
			setValueForm(getInitialValueForm());
			setValueFieldErrors({});
			setIsAddValueDialogOpen(false);
			setValCurrentPage(1);
			setRefreshKey((prev) => prev + 1);
		} catch (submitError) {
			if (axios.isAxiosError<ApiErrorResponse>(submitError)) {
				const responseData = submitError.response?.data;
				const serverErrors = responseData?.errors;

				if (serverErrors) {
					setValueFieldErrors({
						value: serverErrors.value?.[0],
						link: serverErrors.link?.[0],
						alt: serverErrors.alt?.[0],
						position: serverErrors.position?.[0],
						is_active: serverErrors.is_active?.[0],
					});
				}

				toast.error(responseData?.message ?? "Không thể tạo giá trị cấu hình.", {
					position: "top-right",
				});
				return;
			}

			toast.error(getErrorMessage(submitError, "Không thể tạo giá trị cấu hình."), {
				position: "top-right",
			});
		} finally {
			setValueSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-48' />
				<div className='flex flex-col gap-6'>
					<Skeleton className='h-48 w-full' />
					<Skeleton className='h-96 w-full' />
				</div>
			</div>
		);
	}

	if (!info) {
		return (
			<div className='flex flex-col gap-4 p-4 md:p-6 lg:p-8'>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/club-informations'>
						<ArrowLeft className='h-4 w-4' />
						Quay lại danh sách
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tải được cấu hình</CardTitle>
						<CardDescription>
							{error ?? "Cấu hình này không tồn tại hoặc đã bị xóa."}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/club-informations'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại danh sách
				</Link>
			</Button>

			<div className='flex flex-col gap-6'>
				<div>
					<Card className='shadow-sm'>
						<CardHeader className='pb-4'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
								<div>
									<div className='mb-1 flex flex-wrap items-center gap-2'>
										<CompactBadgeList
											items={[
												{
													key: "id",
													label: `#${info.id}`,
													className:
														"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
												},
												...getStatusBadgeItems(info.is_active),
											]}
											maxVisibleItems={2}
										/>
									</div>
									<CardTitle className='text-lg leading-snug'>
										{isEditingInfo ? "Chỉnh sửa cấu hình" : info.label}
									</CardTitle>
									<CardDescription>Thông tin cấu hình CLB</CardDescription>
								</div>
								{!isEditingInfo ? (
									<Button
										type='button'
										size='sm'
										variant='outline'
										onClick={startEditInfo}
										className='h-8 w-fit self-start'>
										<SquarePen className='h-4 w-4' />
										Sửa
									</Button>
								) : null}
							</div>
						</CardHeader>
						{isEditingInfo && infoForm ? (
							<form onSubmit={(event) => void handleUpdateInfoSubmit(event)}>
								<CardContent className='grid gap-6 sm:grid-cols-2'>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='info_label'>
											Tên cấu hình <span className='text-destructive'>*</span>
										</Label>
										<Input
											id='info_label'
											value={infoForm.label}
											onChange={(event) =>
												setInfoField("label", event.target.value)
											}
											disabled={infoSubmitting}
										/>
										{infoFieldErrors.label ? (
											<p className='text-sm text-destructive'>
												{infoFieldErrors.label}
											</p>
										) : null}
									</div>

									<div className='flex flex-col gap-2'>
										<Label htmlFor='info_value'>
											Giá trị key <span className='text-destructive'>*</span>
										</Label>
										<Input
											id='info_value'
											value={infoForm.value}
											onChange={(event) =>
												setInfoField("value", event.target.value)
											}
											disabled={infoSubmitting}
										/>
										{infoFieldErrors.value ? (
											<p className='text-sm text-destructive'>
												{infoFieldErrors.value}
											</p>
										) : null}
									</div>

									<div className='flex flex-col gap-2'>
										<Label htmlFor='info_slug'>
											Slug <span className='text-destructive'>*</span>
										</Label>
										<Input
											id='info_slug'
											value={infoForm.slug}
											onChange={(event) =>
												setInfoField("slug", event.target.value)
											}
											disabled={infoSubmitting}
										/>
										{infoFieldErrors.slug ? (
											<p className='text-sm text-destructive'>
												{infoFieldErrors.slug}
											</p>
										) : null}
									</div>

									<div className='flex flex-col gap-2'>
										<Label htmlFor='info_type'>
											Kiểu dữ liệu <span className='text-destructive'>*</span>
										</Label>
										<Select
											value={infoForm.type}
											onValueChange={(value) => setInfoField("type", value)}
											disabled={infoSubmitting}>
											<SelectTrigger id='info_type' className='w-full'>
												<SelectValue placeholder='Chọn kiểu dữ liệu' />
											</SelectTrigger>
											<SelectContent>
												{CLUB_INFORMATION_TYPES.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{infoFieldErrors.type ? (
											<p className='text-sm text-destructive'>
												{infoFieldErrors.type}
											</p>
										) : null}
									</div>

									<div className='flex flex-col gap-2 sm:col-span-2'>
										<Label htmlFor='info_description'>Mô tả</Label>
										<Textarea
											id='info_description'
											value={infoForm.description}
											onChange={(event) =>
												setInfoField("description", event.target.value)
											}
											disabled={infoSubmitting}
											rows={3}
										/>
										{infoFieldErrors.description ? (
											<p className='text-sm text-destructive'>
												{infoFieldErrors.description}
											</p>
										) : null}
									</div>

									<div className='flex items-center gap-3 sm:col-span-2'>
										<Switch
											id='info_is_active'
											checked={infoForm.is_active}
											onCheckedChange={(checked) =>
												setInfoField("is_active", checked)
											}
											disabled={infoSubmitting}
										/>
										<Label htmlFor='info_is_active' className='cursor-pointer'>
											{infoForm.is_active ? "Đang dùng" : "Tạm ẩn"}
										</Label>
									</div>

									<div className='flex justify-end gap-3 border-t pt-6 sm:col-span-2'>
										<Button
											type='button'
											variant='outline'
											onClick={cancelEditInfo}
											disabled={infoSubmitting}>
											Hủy
										</Button>
										<Button type='submit' disabled={infoSubmitting}>
											{infoSubmitting ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : null}
											Lưu
										</Button>
									</div>
								</CardContent>
							</form>
						) : (
							<CardContent className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4'>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<Tag className='h-3.5 w-3.5' />
											Nhãn
										</span>
									}
									value={info.label}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<Hash className='h-3.5 w-3.5' />
											Giá trị
										</span>
									}
									value={info.value || "--"}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<Info className='h-3.5 w-3.5' />
											Slug
										</span>
									}
									value={
										<CompactBadgeList
											items={getSlugBadgeItems(info.slug)}
											maxVisibleItems={1}
											emptyLabel='--'
										/>
									}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<Type className='h-3.5 w-3.5' />
											Kiểu dữ liệu
										</span>
									}
									value={
										<CompactBadgeList
											items={getTypeBadgeItems(info.type)}
											maxVisibleItems={1}
											emptyLabel='--'
										/>
									}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<FileText className='h-3.5 w-3.5' />
											Mô tả
										</span>
									}
									value={info.description || "--"}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<ToggleLeft className='h-3.5 w-3.5' />
											Trạng thái
										</span>
									}
									value={info.is_active === false ? "Tạm ẩn" : "Đang dùng"}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<CalendarDays className='h-3.5 w-3.5' />
											Ngày tạo
										</span>
									}
									value={formatDate(info.created_at)}
								/>
								<InfoRow
									label={
										<span className='flex items-center gap-1.5'>
											<CalendarDays className='h-3.5 w-3.5' />
											Cập nhật
										</span>
									}
									value={formatDate(info.updated_at)}
								/>
							</CardContent>
						)}
					</Card>
				</div>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-1 items-center justify-between gap-2'>
							<Input
								placeholder='Tìm kiếm...'
								value={valSearch}
								onChange={(event) => setValSearch(event.target.value)}
								className='h-8 w-full sm:max-w-sm'
							/>
							<div className='flex items-center gap-2'>
								<Button
									size='sm'
									onClick={() => handleAddValueDialogOpenChange(true)}
									disabled={isBooleanType && values.length >= 1}
									title={isBooleanType && values.length >= 1 ? "Cấu hình boolean chỉ được có 1 giá trị" : undefined}
									className='h-8 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50'>
									<Plus className='h-4 w-4' />
									Thêm
								</Button>
							</div>
						</div>
					</div>

					<div className='flex flex-col gap-4'>
						{/* colSpan: base 7 + alt(image/banner) + link+position(banner) */}
						<div className='overflow-hidden rounded-md border'>
							<Table className='table-fixed'>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[50px]'>
											<Checkbox
												aria-label='Select all'
												checked={allSelected}
												onCheckedChange={(checked) =>
													toggleAll(checked === true)
												}
											/>
										</TableHead>
										<TableHead className='w-[60px]'>
											<Button
												variant='ghost'
												onClick={() => handleValSort("id")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												ID{getValSortIcon("id")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant='ghost'
												onClick={() => handleValSort("value")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												{valueColLabel}
												{getValSortIcon("value")}
											</Button>
										</TableHead>
										{isImageType && (
											<TableHead className='w-[140px]'>
												<Button
													variant='ghost'
													onClick={() => handleValSort("alt")}
													className='-ml-4 h-8 hover:bg-muted-foreground/10'>
													Alt text{getValSortIcon("alt")}
												</Button>
											</TableHead>
										)}
										{isBannerType && (
											<>
												<TableHead className='w-[140px]'>
													<Button
														variant='ghost'
														onClick={() => handleValSort("link")}
														className='-ml-4 h-8 hover:bg-muted-foreground/10'>
														Link đích{getValSortIcon("link")}
													</Button>
												</TableHead>
												<TableHead className='w-[80px]'>
													<Button
														variant='ghost'
														onClick={() => handleValSort("position")}
														className='-ml-4 h-8 hover:bg-muted-foreground/10'>
														Vị trí{getValSortIcon("position")}
													</Button>
												</TableHead>
											</>
										)}
										{!isBooleanType && (
											<TableHead className='w-[110px]'>
												<Button
													variant='ghost'
													onClick={() => handleValSort("is_active")}
													className='-ml-4 h-8 hover:bg-muted-foreground/10'>
													Trạng thái{getValSortIcon("is_active")}
												</Button>
											</TableHead>
										)}
										<TableHead className='w-[105px]'>
											<Button
												variant='ghost'
												onClick={() => handleValSort("created_at")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Ngày tạo{getValSortIcon("created_at")}
											</Button>
										</TableHead>
										<TableHead className='w-[125px]'>
											<Button
												variant='ghost'
												onClick={() => handleValSort("updated_at")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Cập nhật{getValSortIcon("updated_at")}
											</Button>
										</TableHead>
										<TableHead className='w-[52px]' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedValues.length > 0 ? (
										paginatedValues.map((val) => (
											<TableRow key={val.id}>
												<TableCell>
													<Checkbox
														aria-label={`Select value ${val.id}`}
														checked={isSelected(val.id)}
														onCheckedChange={(checked) =>
															toggleOne(val.id, checked === true)
														}
													/>
												</TableCell>
												<TableCell className='font-medium'>
													{val.id}
												</TableCell>

												{/* Value cell — per type */}
												<TableCell className='overflow-hidden'>
													{info.type === "boolean" ? (
														<Badge
															variant='outline'
															className={
																val.value === "true"
																	? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
																	: "border-muted-foreground/20 bg-muted text-muted-foreground"
															}>
															{val.value === "true"
																? "True — Bật"
																: "False — Tắt"}
														</Badge>
													) : info.type === "url" ? (
														<a
															href={val.value}
															target='_blank'
															rel='noopener noreferrer'
															className='flex items-center gap-1 text-blue-600 hover:underline min-w-0'>
															<span
																className='truncate text-sm'
																title={val.value}>
																{val.value}
															</span>
															<ExternalLink className='h-3 w-3 shrink-0' />
														</a>
													) : info.type === "html" ? (
														<div className='flex min-w-0 items-center gap-2'>
															<Badge
																variant='secondary'
																className='shrink-0 text-xs'>
																HTML
															</Badge>
															<span
																className='truncate text-xs text-muted-foreground'
																title={val.value}>
																{val.value.replace(/<[^>]+>/g, " ")}
															</span>
														</div>
													) : isImageType ? (
														<a
															href={val.value}
															target='_blank'
															rel='noopener noreferrer'
															className='flex min-w-0 items-center gap-3 text-blue-600 hover:underline'>
															<Avatar className='h-10 w-10 rounded-md'>
																<AvatarImage
																	src={val.value}
																	alt={val.alt ?? ""}
																	className='object-cover'
																/>
																<AvatarFallback className='rounded-md text-[10px]'>
																	IMG
																</AvatarFallback>
															</Avatar>
															<span
																className='min-w-0 truncate text-xs'
																title={val.value}>
																{val.value}
															</span>
															<ExternalLink className='h-3 w-3 shrink-0' />
														</a>
													) : (
														<span
															className='truncate'
															title={val.value}>
															{val.value}
														</span>
													)}
												</TableCell>

												{/* Alt — image / banner */}
												{isImageType && (
													<TableCell className='overflow-hidden text-sm text-muted-foreground'>
														<span
															className='truncate'
															title={val.alt ?? ""}>
															{val.alt || "--"}
														</span>
													</TableCell>
												)}

												{/* Link + Position — banner */}
												{isBannerType && (
													<>
														<TableCell className='overflow-hidden'>
															{val.link ? (
																<a
																	href={val.link}
																	target='_blank'
																	rel='noopener noreferrer'
																	className='flex items-center gap-1 text-blue-600 hover:underline min-w-0'>
																	<span
																		className='truncate text-xs'
																		title={val.link}>
																		{val.link}
																	</span>
																	<ExternalLink className='h-3 w-3 shrink-0' />
																</a>
															) : (
																<span className='text-muted-foreground'>
																	--
																</span>
															)}
														</TableCell>
														<TableCell className='text-center font-medium'>
															{val.position ?? "--"}
														</TableCell>
													</>
												)}

												{!isBooleanType && (
													<TableCell>
														<CompactBadgeList
															items={getStatusBadgeItems(val.is_active)}
															maxVisibleItems={1}
														/>
													</TableCell>
												)}
												<TableCell className='text-sm text-muted-foreground'>
													{formatDate(val.created_at)}
												</TableCell>
												<TableCell className='text-sm text-muted-foreground'>
													{formatDate(val.updated_at)}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
																<MoreHorizontal className='h-4 w-4' />
																<span className='sr-only'>
																	Open menu
																</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align='end'
															className='w-[160px]'>
																<DropdownMenuItem
																	onClick={() =>
																		openValueDetail(val)
																	}>
																<Eye className='h-4 w-4' />
																Chi tiết
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className='text-destructive focus:bg-destructive/10 focus:text-destructive'
																onClick={() =>
																	setValuePendingDelete(val)
																}>
																<Trash2 className='h-4 w-4 text-destructive' />
																Xóa
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={tableColSpan}
												className='h-24 text-center'>
												Không tìm thấy kết quả phù hợp.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter className='bg-transparent'>
									<TableRow>
										<TableCell colSpan={tableColSpan}>
											<div className='flex items-center justify-between px-2'>
												<div className='flex-1 text-sm text-muted-foreground'>
													Đang hiện {paginatedValues.length} trên tổng{" "}
													{sortedValues.length} dòng.
												</div>
												<div className='flex items-center space-x-6 lg:space-x-8'>
													<div className='flex items-center space-x-2'>
														<p className='text-sm font-medium'>
															Rows per page
														</p>
														<Select
															value={`${valPerPage}`}
															onValueChange={(v) => {
																setValPerPage(Number(v));
																setValCurrentPage(1);
															}}>
															<SelectTrigger className='h-8 w-[70px]'>
																<SelectValue
																	placeholder={`${valPerPage}`}
																/>
															</SelectTrigger>
															<SelectContent side='top'>
																{[10, 20, 25, 30, 40, 50].map(
																	(s) => (
																		<SelectItem
																			key={s}
																			value={`${s}`}>
																			{s}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
													</div>
													<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
														Page {valCurrentPage} of {valLastPage}
													</div>
													<div className='flex items-center space-x-2'>
														<Button
															variant='outline'
															className='hidden h-8 w-8 p-0 lg:flex'
															onClick={() => setValCurrentPage(1)}
															disabled={valCurrentPage === 1}>
															<span className='sr-only'>
																Đi đến trang đầu
															</span>
															<ChevronsLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															className='h-8 w-8 p-0'
															onClick={() =>
																setValCurrentPage((p) => p - 1)
															}
															disabled={valCurrentPage === 1}>
															<span className='sr-only'>
																Quay lại trang trước
															</span>
															<ChevronLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															className='h-8 w-8 p-0'
															onClick={() =>
																setValCurrentPage((p) => p + 1)
															}
															disabled={
																valCurrentPage >= valLastPage
															}>
															<span className='sr-only'>
																Đi đến trang tiếp theo
															</span>
															<ChevronRight className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															className='hidden h-8 w-8 p-0 lg:flex'
															onClick={() =>
																setValCurrentPage(valLastPage)
															}
															disabled={
																valCurrentPage >= valLastPage
															}>
															<span className='sr-only'>
																Đi đến trang cuối
															</span>
															<ChevronsRight className='h-4 w-4' />
														</Button>
													</div>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</div>
				</div>
			</div>

			<AlertDialog
				open={Boolean(valuePendingDelete)}
				onOpenChange={handleDeleteValueDialogOpenChange}>
				<AlertDialogContent className='w-[calc(100vw-2rem)] max-w-[540px] overflow-hidden'>
					<AlertDialogHeader className='min-w-0'>
						<AlertDialogTitle>Xóa giá trị cấu hình?</AlertDialogTitle>
						<AlertDialogDescription className='min-w-0 space-y-2'>
							<span>Giá trị</span>
							<span className='block max-w-full break-all rounded-md bg-muted/50 px-2 py-1 font-medium text-foreground'>
								{valuePendingDelete?.value ?? ""}
							</span>
							<span className='block break-words'>
								sẽ bị xóa khỏi cấu hình "{info.label}". Hành động này không thể
								hoàn tác.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className='min-w-0'>
						<AlertDialogCancel disabled={valueDeleting}>Hủy</AlertDialogCancel>
						<Button
							type='button'
							variant='destructive'
							onClick={() => void handleDeleteValueSubmit()}
							disabled={valueDeleting}>
							{valueDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
							Xóa
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={isAddValueDialogOpen} onOpenChange={handleAddValueDialogOpenChange}>
				<DialogContent className='sm:max-w-[540px]'>
					<DialogHeader>
						<DialogTitle>
							Thêm giá trị —{" "}
							<span className='font-normal text-muted-foreground'>{info.label}</span>
						</DialogTitle>
					</DialogHeader>

					<form
						onSubmit={(e) => void handleAddValueSubmit(e)}
						className='flex flex-col gap-4'>
						{/* value — boolean: select; html: textarea; others: input */}
						<div className='space-y-2'>
							<Label htmlFor='val_value'>
								{info.type === "image" || info.type === "banner"
									? "URL ảnh"
									: "Giá trị"}
								<span className='text-destructive'> *</span>
							</Label>

							{info.type === "boolean" ? (
								<Select
									value={valueForm.value}
									onValueChange={(v) => {
										setValueForm((p) => ({ ...p, value: v }));
										setValueFieldErrors((p) => ({ ...p, value: undefined }));
									}}
									disabled={valueSubmitting}>
									<SelectTrigger id='val_value'>
										<SelectValue placeholder='Chọn giá trị' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='true'>True (Bật)</SelectItem>
										<SelectItem value='false'>False (Tắt)</SelectItem>
									</SelectContent>
								</Select>
							) : info.type === "html" ? (
								<textarea
									id='val_value'
									className='flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
									placeholder='Nhập nội dung HTML...'
									value={valueForm.value}
									onChange={(e) => {
										setValueForm((p) => ({ ...p, value: e.target.value }));
										setValueFieldErrors((p) => ({ ...p, value: undefined }));
									}}
									disabled={valueSubmitting}
									autoFocus
								/>
							) : (
								<Input
									id='val_value'
									type={info.type === "url" ? "url" : "text"}
									placeholder={
										info.type === "url"
											? "https://..."
											: info.type === "image" || info.type === "banner"
												? "https://example.com/image.jpg"
												: "Nhập giá trị..."
									}
									value={valueForm.value}
									onChange={(e) => {
										setValueForm((p) => ({ ...p, value: e.target.value }));
										setValueFieldErrors((p) => ({ ...p, value: undefined }));
									}}
									disabled={valueSubmitting}
									autoFocus
								/>
							)}
							{valueFieldErrors.value && (
								<p className='text-sm text-destructive'>{valueFieldErrors.value}</p>
							)}
						</div>

						{/* alt — image & banner */}
						{(info.type === "image" || info.type === "banner") && (
							<div className='space-y-2'>
								<Label htmlFor='val_alt'>Alt text</Label>
								<Input
									id='val_alt'
									placeholder='Mô tả ảnh (dùng cho SEO & accessibility)'
									value={valueForm.alt}
									onChange={(e) => {
										setValueForm((p) => ({ ...p, alt: e.target.value }));
										setValueFieldErrors((p) => ({ ...p, alt: undefined }));
									}}
									disabled={valueSubmitting}
								/>
								{valueFieldErrors.alt && (
									<p className='text-sm text-destructive'>
										{valueFieldErrors.alt}
									</p>
								)}
							</div>
						)}

						{/* link & position — banner only */}
						{info.type === "banner" && (
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='val_link'>Link đích</Label>
									<Input
										id='val_link'
										type='url'
										placeholder='https://...'
										value={valueForm.link}
										onChange={(e) => {
											setValueForm((p) => ({ ...p, link: e.target.value }));
											setValueFieldErrors((p) => ({ ...p, link: undefined }));
										}}
										disabled={valueSubmitting}
									/>
									{valueFieldErrors.link && (
										<p className='text-sm text-destructive'>
											{valueFieldErrors.link}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='val_position'>Vị trí</Label>
									<Input
										id='val_position'
										type='number'
										min={0}
										placeholder='0'
										value={valueForm.position}
										onChange={(e) => {
											setValueForm((p) => ({
												...p,
												position: e.target.value,
											}));
											setValueFieldErrors((p) => ({
												...p,
												position: undefined,
											}));
										}}
										disabled={valueSubmitting}
									/>
									{valueFieldErrors.position && (
										<p className='text-sm text-destructive'>
											{valueFieldErrors.position}
										</p>
									)}
								</div>
							</div>
						)}

						{/* is_active — ẩn cho boolean vì chính value true/false đã là toggle */}
						{!isBooleanType && (
							<div className='flex items-center justify-between rounded-md border bg-muted/30 p-4'>
								<Label htmlFor='val_active' className='cursor-pointer'>
									{valueForm.is_active ? "Đang dùng" : "Tạm ẩn"}
								</Label>
								<Switch
									id='val_active'
									checked={valueForm.is_active}
									onCheckedChange={(checked) =>
										setValueForm((p) => ({ ...p, is_active: checked }))
									}
									disabled={valueSubmitting}
								/>
							</div>
						)}

						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => handleAddValueDialogOpenChange(false)}
								disabled={valueSubmitting}>
								Hủy
							</Button>
							<Button type='submit' disabled={valueSubmitting}>
								{valueSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
								Lưu
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(selectedValue)}
				onOpenChange={(open) => {
					if (!open) closeValueDetail();
				}}>
				<DialogContent className='w-[calc(100vw-2rem)] max-w-[540px] overflow-hidden'>
					{selectedValue ? (
						<>
							<DialogHeader>
								<DialogTitle className='min-w-0'>
									Chi tiết giá trị —{" "}
									<span className='break-words font-normal text-muted-foreground'>
										{info.label}
									</span>
								</DialogTitle>
							</DialogHeader>

							<div className='flex min-w-0 flex-col gap-4'>
								<div className='min-w-0 space-y-2'>
									<Label htmlFor='detail_val_value'>
										{info.type === "image" || info.type === "banner"
											? "URL ảnh"
											: "Giá trị"}
									</Label>

										{info.type === "boolean" ? (
											<Select
												value={
													isEditingValue
														? detailValueForm.value
														: selectedValue.value
												}
												onValueChange={(value) =>
													setDetailValueField("value", value)
												}
												disabled={!isEditingValue || detailValueSubmitting}>
												<SelectTrigger id='detail_val_value' className='w-full'>
													<SelectValue placeholder='--' />
												</SelectTrigger>
											<SelectContent>
												<SelectItem value='true'>True (Bật)</SelectItem>
												<SelectItem value='false'>False (Tắt)</SelectItem>
											</SelectContent>
										</Select>
									) : info.type === "html" ? (
											<Textarea
												id='detail_val_value'
												value={
													isEditingValue
														? detailValueForm.value
														: selectedValue.value
												}
												onChange={(event) =>
													setDetailValueField("value", event.target.value)
												}
												readOnly={!isEditingValue}
												disabled={detailValueSubmitting}
												rows={5}
												className='max-w-full break-all'
											/>
										) : info.type === "url" ||
											info.type === "image" ||
											info.type === "banner" ? (
											isEditingValue ? (
												<Input
													id='detail_val_value'
													type='url'
													value={detailValueForm.value}
													onChange={(event) =>
														setDetailValueField(
															"value",
															event.target.value,
														)
													}
													disabled={detailValueSubmitting}
													className='min-w-0'
												/>
											) : (
												<div
													id='detail_val_value'
													className='flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs'>
													<span
														className='block min-w-0 flex-1 truncate'
														title={selectedValue.value}>
														{selectedValue.value}
													</span>
												</div>
											)
										) : (
											<Input
												id='detail_val_value'
												type='text'
												value={
													isEditingValue
														? detailValueForm.value
														: selectedValue.value
												}
												onChange={(event) =>
													setDetailValueField("value", event.target.value)
												}
												readOnly={!isEditingValue}
												disabled={detailValueSubmitting}
												className='min-w-0'
											/>
										)}
										{detailValueFieldErrors.value ? (
											<p className='text-sm text-destructive'>
												{detailValueFieldErrors.value}
											</p>
										) : null}
									</div>

								{isImageType ? (
									<div className='flex min-w-0 items-center gap-3 overflow-hidden rounded-md border bg-muted/30 p-3'>
											<Avatar className='h-14 w-14 shrink-0 rounded-md'>
												<AvatarImage
													src={selectedValuePreview}
													alt={selectedAltPreview}
													className='object-cover'
												/>
											<AvatarFallback className='rounded-md text-xs'>
												IMG
											</AvatarFallback>
										</Avatar>
											<a
												href={selectedValuePreview}
												target='_blank'
												rel='noopener noreferrer'
											className='flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm text-blue-600 hover:underline'>
												<span
													className='block min-w-0 flex-1 truncate'
													title={selectedValuePreview}>
													{selectedValuePreview}
												</span>
											<ExternalLink className='h-3.5 w-3.5 shrink-0' />
										</a>
									</div>
								) : null}

								{isImageType ? (
										<div className='min-w-0 space-y-2'>
											<Label htmlFor='detail_val_alt'>Alt text</Label>
											<Input
												id='detail_val_alt'
												value={selectedAltPreview}
												onChange={(event) =>
													setDetailValueField("alt", event.target.value)
												}
												readOnly={!isEditingValue}
												disabled={detailValueSubmitting}
												className='min-w-0'
											/>
											{detailValueFieldErrors.alt ? (
												<p className='text-sm text-destructive'>
													{detailValueFieldErrors.alt}
												</p>
											) : null}
										</div>
								) : null}

								{isBannerType ? (
									<div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'>
										<div className='min-w-0 space-y-2'>
											<Label htmlFor='detail_val_link'>Link đích</Label>
												{isEditingValue ? (
													<Input
														id='detail_val_link'
														type='url'
														value={detailValueForm.link}
														onChange={(event) =>
															setDetailValueField(
																"link",
																event.target.value,
															)
														}
														disabled={detailValueSubmitting}
														className='min-w-0'
													/>
												) : (
													<div
														id='detail_val_link'
														className='flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs'>
														<span
															className='block min-w-0 flex-1 truncate'
															title={selectedLinkPreview}>
															{selectedLinkPreview || "--"}
														</span>
													</div>
												)}
												{detailValueFieldErrors.link ? (
													<p className='text-sm text-destructive'>
														{detailValueFieldErrors.link}
													</p>
												) : null}
											</div>
										<div className='min-w-0 space-y-2'>
											<Label htmlFor='detail_val_position'>Vị trí</Label>
											<Input
												id='detail_val_position'
												type={isEditingValue ? "number" : "text"}
												min={0}
												value={
													isEditingValue
														? detailValueForm.position
														: selectedValue.position ?? ""
												}
												onChange={(event) =>
													setDetailValueField(
														"position",
														event.target.value,
													)
												}
												readOnly={!isEditingValue}
												disabled={detailValueSubmitting}
												className='min-w-0'
											/>
											{detailValueFieldErrors.position ? (
												<p className='text-sm text-destructive'>
													{detailValueFieldErrors.position}
												</p>
											) : null}
										</div>
									</div>
								) : null}

									{/* is_active — ẩn cho boolean vì chính value true/false đã là toggle */}
									{!isBooleanType && (
										<div className='flex items-center justify-between rounded-md border bg-muted/30 p-4'>
											<Label htmlFor='detail_val_active' className='cursor-pointer'>
												{(isEditingValue
													? detailValueForm.is_active
													: selectedValue.is_active !== false)
													? "Đang dùng"
													: "Tạm ẩn"}
											</Label>
											<Switch
												id='detail_val_active'
												checked={
													isEditingValue
														? detailValueForm.is_active
														: selectedValue.is_active !== false
												}
												onCheckedChange={(checked) =>
													setDetailValueField("is_active", checked)
												}
												disabled={!isEditingValue || detailValueSubmitting}
											/>
										</div>
									)}
									{detailValueFieldErrors.is_active ? (
										<p className='text-sm text-destructive'>
											{detailValueFieldErrors.is_active}
										</p>
									) : null}

								<div className='grid min-w-0 grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2'>
									<InfoRow
										label='Ngày tạo'
										value={formatDate(selectedValue.created_at)}
									/>
									<InfoRow
										label='Cập nhật'
										value={formatDate(selectedValue.updated_at)}
									/>
								</div>
							</div>

							<DialogFooter>
									<Button
										type='button'
										variant='outline'
										onClick={closeValueDetail}
										disabled={detailValueSubmitting}>
										Đóng
									</Button>
									<Button
										type='button'
										onClick={() => {
											if (isEditingValue) {
												void handleUpdateValueSubmit();
												return;
											}
											setDetailValueForm(getValueFormFromRecord(selectedValue));
											setDetailValueFieldErrors({});
											setIsEditingValue(true);
										}}
										disabled={detailValueSubmitting}>
										{detailValueSubmitting ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : null}
										{isEditingValue ? "Lưu" : "Chỉnh sửa"}
									</Button>
								</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ClubInformationDetailPage;
