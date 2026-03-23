function Sidebar() {
	return (
		<>
			<aside className='app-sidebar bg-body-secondary shadow' data-bs-theme='dark'>
				<div className='sidebar-brand'>
					<a href='/' className='brand-link'>
						<img
							src='./img/ckc-it-club-logo.jpg'
							alt='CKC IT CLUB Logo'
							className='brand-image opacity-75 shadow'
							style={{
								width: "32px",
								height: "32px",
								borderRadius: "50%",
								border: "1px solid #fff",
							}}
						/>
						<span className='brand-text fw-light'>CKC IT CLUB</span>
					</a>
				</div>
				<div className='sidebar-wrapper'>
					<nav className='mt-2'>
						<ul
							className='nav sidebar-menu flex-column'
							data-lte-toggle='treeview'
							role='navigation'
							aria-label='Main navigation'
							data-accordion='false'
							id='navigation'>
							<li className='nav-item'>
								<a href='#' className='nav-link'>
									<i className='nav-icon bi bi-house-door'></i>
									<p>
										Dashboard
										<i className='nav-arrow bi bi-chevron-right'></i>
									</p>
								</a>
								<ul className='nav nav-treeview'>
									<li className='nav-item'>
										<a href='./index.html' className='nav-link'>
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
								<a href='#' className='nav-link'>
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
								<a href='#' className='nav-link'>
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
								<a href='#' className='nav-link'>
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
								<a href='#' className='nav-link'>
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
					</nav>
				</div>
			</aside>
		</>
	);
}

export default Sidebar;
