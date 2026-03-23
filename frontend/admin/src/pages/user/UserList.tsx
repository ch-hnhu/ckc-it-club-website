import userService from "@/services/user.service";
import type { User } from "@/types/user.type";
import { useEffect, useState } from "react";

function UserList() {
	const [users, setUsers] = useState<User[]>([]);

	useEffect(() => {
		userService.getUsers().then((response) => {
			setUsers(response.data);
		});
	}, []);

	return (
		<>
			<main className='app-main'>
				<div className='app-content-header'>
					<div className='container-fluid'>
						<div className='row'>
							<div className='col-sm-12'>
								<h3 className='mb-0'>User List</h3>
							</div>
						</div>
					</div>
				</div>
				<div className='app-content'>
					<div className='container-fluid'>
						<div className='row'>
							<div className='col-lg-3 col-6'>
								<ul className='p-0 m-0'>
									{users.map((user) => (
										<li key={user.id}>
											{user.full_name} ({user.email})
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

export default UserList;
