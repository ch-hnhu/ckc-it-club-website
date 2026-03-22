function Sidebar() {
	return (
		<>
			{/* begin::Sidebar */}
			<aside className='app-sidebar bg-body-secondary shadow' data-bs-theme='dark'>
				{/* begin::Sidebar Brand */}
				<div className='sidebar-brand'>
					{/* begin::Brand Link */}
					<a href='./index.html' className='brand-link'>
						{/* begin::Brand Image */}
						<img
							src='./img/ckc-it-club-logo.jpg'
							alt='CKC IT CLUB Logo'
							className='brand-image opacity-75 shadow'
						/>
						{/* end::Brand Image */}
						{/* begin::Brand Text */}
						<span className='brand-text fw-light'>CKC IT CLUB</span>
						{/* end::Brand Text */}
					</a>
					{/* end::Brand Link */}
				</div>
				{/* end::Sidebar Brand */}
				{/* begin::Sidebar Wrapper */}
				<div className='sidebar-wrapper'>
					<nav className='mt-2'>
						{/* begin::Sidebar Menu */}
						<ul
							className='nav sidebar-menu flex-column'
							data-lte-toggle='treeview'
							role='navigation'
							aria-label='Main navigation'
							data-accordion='false'
							id='navigation'>
							<li className='nav-item'>
								<a href='#' className='nav-link active'>
									<i className='nav-icon bi bi-house-door'></i>
									<p>
										Dashboard
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link active'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Thống kê</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Báo cáo</p>
										</a>
									</li>
								</ul>
							</li>
							<li className='nav-item'>
								<a href='#' className='nav-link active'>
									<i className='nav-icon bi bi-people'></i>
									<p>
										Quản lý người dùng
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Người dùng</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Vai trò</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Phân quyền</p>
										</a>
									</li>
								</ul>
							</li>
							<li className='nav-item'>
								<a href='#' className='nav-link active'>
									<i className='nav-icon bi bi-building'></i>
									<p>
										Quản lý đơn vị
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Khoa</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Ngành</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Lớp</p>
										</a>
									</li>
								</ul>
							</li>
							<li className='nav-item'>
								<a href='#' className='nav-link active'>
									<i className='nav-icon bi bi-trophy'></i>
									<p>
										Quản lý CLB
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Các ban</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Thông tin CLB</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Trường thông tin</p>
										</a>
									</li>
								</ul>
							</li>
							<li className='nav-item'>
								<a href='#' className='nav-link active'>
									<i className='nav-icon bi bi-person-plus'></i>
									<p>
										Tuyển thành viên
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Câu hỏi ứng tuyển</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Lựa chọn câu hỏi</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Câu trả lời</p>
										</a>
									</li>
									<li className='nav-item'>
										<a href='./index2.html' className='nav-link'>
											<i className='nav-icon bi bi-circle'></i>
											<p>Yêu cầu tham gia</p>
										</a>
									</li>
								</ul>
							</li>
						</ul>
						{/* end::Sidebar Menu */}
					</nav>
				</div>
				{/* end::Sidebar Wrapper */}
			</aside>
			{/* end::Sidebar */}
		</>
	);
}

export default Sidebar;
