<?php

namespace App\Enums;

/**
 * API Response Messages
 *
 * Định nghĩa tất cả các message chuẩn cho API responses
 */
enum ApiMessage: string
{
    // General Messages
    case SUCCESS = 'Operation completed successfully';
    case ERROR = 'An error occurred';
    case VALIDATION_ERROR = 'Validation failed';

    // Authentication & Authorization
    case UNAUTHORIZED = 'Unauthorized. Please login to continue';
    case FORBIDDEN = 'You do not have permission to perform this action';
    case TOKEN_EXPIRED = 'Your session has expired. Please login again';
    case INVALID_CREDENTIALS = 'Invalid email or password';
    case LOGIN_SUCCESS = 'Login successful';
    case LOGOUT_SUCCESS = 'Logout successful';
    case REGISTER_SUCCESS = 'Registration successful';

    // Resource Operations - Generic
    case CREATED = 'Resource created successfully';
    case UPDATED = 'Resource updated successfully';
    case DELETED = 'Resource deleted successfully';
    case RETRIEVED = 'Resource retrieved successfully';
    case NOT_FOUND = 'Resource not found';

    // Product Specific
    case PRODUCT_CREATED = 'Product created successfully';
    case PRODUCT_UPDATED = 'Product updated successfully';
    case PRODUCT_DELETED = 'Product deleted successfully';
    case PRODUCT_RETRIEVED = 'Product retrieved successfully';
    case PRODUCTS_RETRIEVED = 'Products retrieved successfully';
    case PRODUCT_NOT_FOUND = 'Product not found';

    // User Specific
    case USER_CREATED = 'User created successfully';
    case USER_UPDATED = 'User updated successfully';
    case USER_DELETED = 'User deleted successfully';
    case USER_RETRIEVED = 'User retrieved successfully';
    case USERS_RETRIEVED = 'Users retrieved successfully';
    case USER_NOT_FOUND = 'User not found';

    // Database & Server Errors
    case DATABASE_ERROR = 'Database error occurred';
    case SERVER_ERROR = 'Internal server error';
    case SERVICE_UNAVAILABLE = 'Service temporarily unavailable';

    // File Operations
    case FILE_UPLOADED = 'File uploaded successfully';
    case FILE_DELETED = 'File deleted successfully';
    case FILE_TOO_LARGE = 'File size exceeds maximum allowed';
    case INVALID_FILE_TYPE = 'Invalid file type';

    // Pagination
    case NO_MORE_DATA = 'No more data available';
    case INVALID_PAGE = 'Invalid page number';

    /**
     * Get translated message
     *
     * @param string|null $locale Language code ('en', 'vi', etc). If null, uses app locale
     * @return string Translated message
     */
    public function translate(?string $locale = null): string
    {
        // Get translation key from enum name
        $key = 'api.' . $this->name;

        // Use Laravel's translation system
        $translated = __($key, [], $locale);

        // If translation not found, fallback to default value
        return $translated === $key ? $this->value : $translated;
    }

    /**
     * Format message with parameters
     *
     * @param array $params Associative array of parameters to replace in message
     * @param string|null $locale Language code for translation
     * @return string Formatted message
     *
     * @example
     * ApiMessage::PRODUCT_NOT_FOUND->format(['name' => 'iPhone'])
     * // If message has "{name}", it will be replaced with "iPhone"
     */
    public function format(array $params = [], ?string $locale = null): string
    {
        // Get translated message first
        $message = $locale ? $this->translate($locale) : $this->value;

        // Replace parameters
        foreach ($params as $key => $value) {
            $message = str_replace("{{$key}}", $value, $message);
        }

        return $message;
    }
}
