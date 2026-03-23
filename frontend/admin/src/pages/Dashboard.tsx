import healthService from "@/services/health.service";
import { useEffect, useState } from "react";

function Dashboard() {
	const [health, setHealth] = useState<string>();

	useEffect(() => {
		healthService.getHealth().then((response) => {
			setHealth(response.message);
		});
	}, []);

	return (
		<>
			<main className='app-main'>
				<div className='app-content-header'>
					<div className='container-fluid'>
						<div className='row'>
							<div className='col-sm-6'>
								<h3 className='mb-0'>{health}</h3>
							</div>
							<div className='col-sm-6'>
								<ol className='breadcrumb float-sm-end'>
									<li className='breadcrumb-item'>
										<a href='#'>Home</a>
									</li>
									<li className='breadcrumb-item active' aria-current='page'>
										Dashboard
									</li>
								</ol>
							</div>
						</div>
					</div>
				</div>
				<div className='app-content'>
					<div className='container-fluid'>
						<div className='row'>
							<div className='col-lg-3 col-6'>
								<div className='small-box text-bg-primary'>
									<div className='inner'>
										<h3>150</h3>

										<p>New Orders</p>
									</div>
									<svg
										className='small-box-icon'
										fill='currentColor'
										viewBox='0 0 24 24'
										xmlns='http://www.w3.org/2000/svg'
										aria-hidden='true'>
										<path d='M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z'></path>
									</svg>
									<a
										href='#'
										className='small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover'>
										More info <i className='bi bi-link-45deg'></i>
									</a>
								</div>
							</div>
							<div className='col-lg-3 col-6'>
								<div className='small-box text-bg-success'>
									<div className='inner'>
										<h3>
											53<sup className='fs-5'>%</sup>
										</h3>

										<p>Bounce Rate</p>
									</div>
									<svg
										className='small-box-icon'
										fill='currentColor'
										viewBox='0 0 24 24'
										xmlns='http://www.w3.org/2000/svg'
										aria-hidden='true'>
										<path d='M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z'></path>
									</svg>
									<a
										href='#'
										className='small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover'>
										More info <i className='bi bi-link-45deg'></i>
									</a>
								</div>
							</div>
							<div className='col-lg-3 col-6'>
								<div className='small-box text-bg-warning'>
									<div className='inner'>
										<h3>44</h3>

										<p>User Registrations</p>
									</div>
									<svg
										className='small-box-icon'
										fill='currentColor'
										viewBox='0 0 24 24'
										xmlns='http://www.w3.org/2000/svg'
										aria-hidden='true'>
										<path d='M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z'></path>
									</svg>
									<a
										href='#'
										className='small-box-footer link-dark link-underline-opacity-0 link-underline-opacity-50-hover'>
										More info <i className='bi bi-link-45deg'></i>
									</a>
								</div>
							</div>
							<div className='col-lg-3 col-6'>
								<div className='small-box text-bg-danger'>
									<div className='inner'>
										<h3>65</h3>

										<p>Unique Visitors</p>
									</div>
									<svg
										className='small-box-icon'
										fill='currentColor'
										viewBox='0 0 24 24'
										xmlns='http://www.w3.org/2000/svg'
										aria-hidden='true'>
										<path
											clipRule='evenodd'
											fillRule='evenodd'
											d='M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z'></path>
										<path
											clipRule='evenodd'
											fillRule='evenodd'
											d='M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z'></path>
									</svg>
									<a
										href='#'
										className='small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover'>
										More info <i className='bi bi-link-45deg'></i>
									</a>
								</div>
							</div>
						</div>
						<div className='row'>
							<div className='col-lg-7 connectedSortable'>
								<div className='card mb-4'>
									<div className='card-header'>
										<h3 className='card-title'>Sales Value</h3>
									</div>

									<div className='card-body'>
										<div id='revenue-chart'></div>
									</div>
								</div>

								<div className='card direct-chat direct-chat-primary mb-4'>
									<div className='card-header'>
										<h3 className='card-title'>Direct Chat</h3>

										<div className='card-tools'>
											<span
												title='3 New Messages'
												className='badge text-bg-primary'>
												3
											</span>
											<button
												type='button'
												className='btn btn-tool'
												data-lte-toggle='card-collapse'>
												<i
													data-lte-icon='expand'
													className='bi bi-plus-lg'></i>
												<i
													data-lte-icon='collapse'
													className='bi bi-dash-lg'></i>
											</button>
											<button
												type='button'
												className='btn btn-tool'
												title='Contacts'
												data-lte-toggle='chat-pane'>
												<i className='bi bi-chat-text-fill'></i>
											</button>
											<button
												type='button'
												className='btn btn-tool'
												data-lte-toggle='card-remove'>
												<i className='bi bi-x-lg'></i>
											</button>
										</div>
									</div>
									<div className='card-body'>
										<div className='direct-chat-messages'>
											<div className='direct-chat-msg'>
												<div className='direct-chat-infos clearfix'>
													<span className='direct-chat-name float-start'>
														Alexander Pierce
													</span>
													<span className='direct-chat-timestamp float-end'>
														23 Jan 2:00 pm
													</span>
												</div>
												<img
													className='direct-chat-img'
													src='./img/user1-128x128.jpg'
													alt='message user image'
												/>
												<div className='direct-chat-text'>
													Is this template really for free? That's
													unbelievable!
												</div>
											</div>

											<div className='direct-chat-msg end'>
												<div className='direct-chat-infos clearfix'>
													<span className='direct-chat-name float-end'>
														Sarah Bullock
													</span>
													<span className='direct-chat-timestamp float-start'>
														23 Jan 2:05 pm
													</span>
												</div>
												<img
													className='direct-chat-img'
													src='./img/user3-128x128.jpg'
													alt='message user image'
												/>
												<div className='direct-chat-text'>
													You better believe it!
												</div>
											</div>

											<div className='direct-chat-msg'>
												<div className='direct-chat-infos clearfix'>
													<span className='direct-chat-name float-start'>
														Alexander Pierce
													</span>
													<span className='direct-chat-timestamp float-end'>
														23 Jan 5:37 pm
													</span>
												</div>
												<img
													className='direct-chat-img'
													src='./img/user1-128x128.jpg'
													alt='message user image'
												/>
												<div className='direct-chat-text'>
													Working with AdminLTE on a great new app! Wanna
													join?
												</div>
											</div>

											<div className='direct-chat-msg end'>
												<div className='direct-chat-infos clearfix'>
													<span className='direct-chat-name float-end'>
														Sarah Bullock
													</span>
													<span className='direct-chat-timestamp float-start'>
														23 Jan 6:10 pm
													</span>
												</div>
												<img
													className='direct-chat-img'
													src='./img/user3-128x128.jpg'
													alt='message user image'
												/>
												<div className='direct-chat-text'>
													I would love to.
												</div>
											</div>
										</div>

										<div className='direct-chat-contacts'>
											<ul className='contacts-list'>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user1-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																Count Dracula
																<small className='contacts-list-date float-end'>
																	2/28/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																How have you been? I was...
															</span>
														</div>
													</a>
												</li>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user7-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																Sarah Doe
																<small className='contacts-list-date float-end'>
																	2/23/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																I will be waiting for...
															</span>
														</div>
													</a>
												</li>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user3-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																Nadia Jolie
																<small className='contacts-list-date float-end'>
																	2/20/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																I'll call you back at...
															</span>
														</div>
													</a>
												</li>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user5-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																Nora S. Vans
																<small className='contacts-list-date float-end'>
																	2/10/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																Where is your new...
															</span>
														</div>
													</a>
												</li>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user6-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																John K.
																<small className='contacts-list-date float-end'>
																	1/27/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																Can I take a look at...
															</span>
														</div>
													</a>
												</li>
												<li>
													<a href='#'>
														<img
															className='contacts-list-img'
															src='./img/user8-128x128.jpg'
															alt='User Avatar'
														/>

														<div className='contacts-list-info'>
															<span className='contacts-list-name'>
																Kenneth M.
																<small className='contacts-list-date float-end'>
																	1/4/2023
																</small>
															</span>
															<span className='contacts-list-msg'>
																Never mind I found...
															</span>
														</div>
													</a>
												</li>
											</ul>
										</div>
									</div>
									<div className='card-footer'>
										<form action='#' method='post'>
											<div className='input-group'>
												<input
													type='text'
													name='message'
													placeholder='Type Message ...'
													className='form-control'
												/>
												<span className='input-group-append'>
													<button
														type='button'
														className='btn btn-primary'>
														Send
													</button>
												</span>
											</div>
										</form>
									</div>
								</div>
							</div>

							<div className='col-lg-5 connectedSortable'>
								<div className='card text-white bg-primary bg-gradient border-primary mb-4'>
									<div className='card-header border-0'>
										<h3 className='card-title'>Sales Value</h3>
										<div className='card-tools'>
											<button
												type='button'
												className='btn btn-primary btn-sm'
												data-lte-toggle='card-collapse'>
												<i
													data-lte-icon='expand'
													className='bi bi-plus-lg'></i>
												<i
													data-lte-icon='collapse'
													className='bi bi-dash-lg'></i>
											</button>
										</div>
									</div>
									<div className='card-body'>
										<div id='world-map' style={{ height: "220px" }}></div>
									</div>
									<div className='card-footer border-0'>
										<div className='row'>
											<div className='col-4 text-center'>
												<div id='sparkline-1' className='text-dark'></div>
												<div className='text-white'>Visitors</div>
											</div>
											<div className='col-4 text-center'>
												<div id='sparkline-2' className='text-dark'></div>
												<div className='text-white'>Online</div>
											</div>
											<div className='col-4 text-center'>
												<div id='sparkline-3' className='text-dark'></div>
												<div className='text-white'>Sales</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

export default Dashboard;
