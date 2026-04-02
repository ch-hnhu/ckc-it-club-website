import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Create axios instance
const clientApi: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
	timeout: 30000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"Accept-Language": "vi",
	},
});

// Request interceptor - runs before every request
clientApi.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = localStorage.getItem("access_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error: AxiosError) => {
		console.error("Request Error:", error);
		return Promise.reject(error);
	},
);

// Response interceptor - runs after every response
clientApi.interceptors.response.use(
	(response: AxiosResponse) => {
		return response;
	},
	(error: AxiosError) => {
		if (error.response) {
			const status = error.response.status;

			switch (status) {
				case 401: {
					console.error("Unauthorized! Redirecting to login...");
					localStorage.removeItem("access_token");
					localStorage.removeItem("user");

					if (window.location.pathname !== "/login") {
						sessionStorage.setItem("redirectPath", window.location.pathname + window.location.search);
						window.location.href = "/login";
					}
					break;
				}

				case 403:
					console.error("Forbidden! You don't have permission");
					break;

				case 404:
					console.error("Resource not found!");
					break;

				case 422:
					console.error("Validation error:", error.response.data);
					break;

				case 500:
					console.error("Server error!");
					break;

				default:
					console.error("Error:", status, error.message);
			}
		} else if (error.request) {
			console.error("No response from server!");
		} else {
			console.error("Error:", error.message);
		}

		return Promise.reject(error);
	},
);

export default clientApi;
