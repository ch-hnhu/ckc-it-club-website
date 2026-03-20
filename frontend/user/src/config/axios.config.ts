import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Create axios instance
const adminAxiosInstance: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
	timeout: 30000, // 30 seconds
	withCredentials: true, // Important for Sanctum cookies
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"Accept-Language": "vi", // or "en" - for multi-language API
	},
});

// Request interceptor - runs before every request
adminAxiosInstance.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Add Authorization token if exists
		const token = localStorage.getItem("access_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		// You can add loading state here
		console.log("Request:", config.method?.toUpperCase(), config.url);

		return config;
	},
	(error: AxiosError) => {
		console.error("Request Error:", error);
		return Promise.reject(error);
	},
);

// Response interceptor - runs after every response
adminAxiosInstance.interceptors.response.use(
	(response: AxiosResponse) => {
		// Success response - just return data
		console.log("Response:", response.status, response.config.url);
		return response;
	},
	(error: AxiosError) => {
		// Error handling
		if (error.response) {
			const status = error.response.status;

			switch (status) {
				case 401:
					// Unauthorized - redirect to login
					console.error("Unauthorized! Redirecting to login...");
					localStorage.removeItem("access_token");
					window.location.href = "/login";
					break;

				case 403:
					// Forbidden
					console.error("Forbidden! You don't have permission");
					break;

				case 404:
					// Not found
					console.error("Resource not found!");
					break;

				case 422:
					// Validation error
					console.error("Validation error:", error.response.data);
					break;

				case 500:
					// Server error
					console.error("Server error!");
					break;

				default:
					console.error("Error:", status, error.message);
			}
		} else if (error.request) {
			// Request made but no response
			console.error("No response from server!");
		} else {
			// Something else happened
			console.error("Error:", error.message);
		}

		return Promise.reject(error);
	},
);

export default adminAxiosInstance;
