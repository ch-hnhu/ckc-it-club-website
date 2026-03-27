import { useEffect, useState } from "react";
import userService from "@/services/user.service";
import type { User } from "@/types/user.type";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Plus,
	Settings2,
} from "lucide-react";

function UserList() {
	const [users, setUsers] = useState<User[]>([]);

	useEffect(() => {
		userService.getUsers().then((response) => {
			setUsers(response.data);
		});
	}, []);

	return (
		<div className='h-full flex-1 flex-col gap-8 p-8'>
			<div className='flex items-center'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>User Management</h2>
					<p className='text-muted-foreground'>
						Here's a list of all users in the system.
					</p>
				</div>
			</div>
			<div className='flex flex-col gap-4 pt-4'>
				<div className='flex items-center justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input
							placeholder='Filter users...'
							className='h-8 w-[150px] lg:w-[250px]'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' className='h-8 lg:flex'>
							<Settings2 className='h-4 w-4' />
							View
						</Button>
						<Button size='sm' className='h-8'>
							<Plus className='h-4 w-4' />
							Add User
						</Button>
					</div>
				</div>
				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'>
									<Checkbox aria-label='Select all' />
								</TableHead>
								<TableHead className='w-[80px]'>ID</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<Checkbox aria-label={`Select user ${user.id}`} />
									</TableCell>
									<TableCell className='font-medium'>USR-{user.id}</TableCell>
									<TableCell>
										<div className='flex items-center gap-3'>
											<Avatar className='h-8 w-8'>
												<AvatarImage
													src={user.avatar}
													alt={user.full_name}
												/>
												<AvatarFallback>
													{user.full_name?.charAt(0) || "U"}
												</AvatarFallback>
											</Avatar>
											<span className='font-medium'>{user.full_name}</span>
										</div>
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										{new Date(user.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end' className='w-[160px]'>
												<DropdownMenuItem>Edit</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{users.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className='h-24 text-center'>
										No users found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				{/* Pagination area */}
				<div className='flex items-center justify-between px-2 pb-4'>
					<div className='flex-1 text-sm text-muted-foreground'>
						0 of {users.length} row(s) selected.
					</div>
					<div className='flex items-center space-x-6 lg:space-x-8'>
						<div className='flex items-center space-x-2'>
							<p className='text-sm font-medium'>Rows per page</p>
							<Select defaultValue="25">
								<SelectTrigger className="h-8 w-[70px]">
									<SelectValue placeholder="25" />
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 25, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
							Page 1 of 1
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								disabled
							>
								<span className="sr-only">Go to first page</span>
								<ChevronsLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								disabled
							>
								<span className="sr-only">Go to previous page</span>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								disabled
							>
								<span className="sr-only">Go to next page</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								disabled
							>
								<span className="sr-only">Go to last page</span>
								<ChevronsRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default UserList;
