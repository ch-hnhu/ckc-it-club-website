# 🎓 CKC IT CLUB WEBSITE

Hệ thống quản lý website cho CLB Công Nghệ Thông Tin CĐKT CT - CKC IT CLUB. Dự án bao gồm Backend API (Laravel 12) và Frontend (React + TypeScript).

---

## 🚀 Công Nghệ Sử Dụng

**Backend:** PHP 8.2+, Laravel 12, MySQL, Laravel Sanctum (Authentication), Spatie Permission (Role & Permission)

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit, Axios

---

## 📁 Cấu Trúc Thư Mục

```
ckc-it-club-website/
│
├── backend/                        # Laravel API Backend
│   ├── app/
│   │   ├── Enums/                 # HTTP Status & API Messages (centralized)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # API Controllers (versioned: V1, V2...)
│   │   │   ├── Middleware/        # CORS, Locale, ApiVersion middleware
│   │   │   ├── Requests/          # Form validation requests
│   │   │   └── Resources/         # API response resources
│   │   ├── Models/                # Eloquent models
│   │   └── Traits/                # ApiResponse trait (response helpers)
│   │
│   ├── config/                    # Cấu hình app, database, cors, sanctum...
│   ├── database/
│   │   ├── migrations/            # Database migrations
│   │   └── seeders/               # Database seeders
│   │
│   ├── lang/                      # Multi-language (en/vi)
│   ├── routes/                    # API routes & Web routes
│   └── .env                       # Environment config (copy from .env.example)
│
└── frontend/user/                 # Admin Dashboard
    ├── src/
    │   ├── components/            # Reusable React components
    │   ├── config/                # Axios config, constants
    │   ├── services/              # API service layer (productService, userService...)
    │   ├── types/                 # TypeScript type definitions
    │   └── pages/                 # Page components (routes)
    │
    ├── package.json               # Dependencies
    └── .env                       # Environment config (VITE_API_URL...)
```

---

## 💻 Yêu Cầu Hệ Thống

- **PHP**: >= 8.2
- **Composer**: >= 2.0
- **Node.js**: >= 18.0 (khuyến nghị 20.x LTS)

---

## 🛠️ Hướng Dẫn Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/ch-hnhu/ckc-it-club-website.git
cd ckc-it-club-website
```

---

### 2️⃣ Setup Backend (Laravel)

#### Bước 1: Cài đặt Dependencies

```bash
cd backend

# Install PHP dependencies
composer install
```

#### Bước 2: Cấu hình Environment

```bash
# Copy file .env
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Bước 3: Cấu hình Database

Mở file `.env` và cập nhật thông tin database:

```env
# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ckc-it-club-db
DB_USERNAME=root
DB_PASSWORD=

# App Configuration
APP_URL=http://localhost:8000
APP_LOCALE=vi
APP_FALLBACK_LOCALE=en

# Frontend URLs for CORS
ADMIN_FRONTEND_URL=http://localhost:5173
USER_FRONTEND_URL=http://localhost:5174
```

#### Bước 4: Tạo Database

```sql
CREATE DATABASE `ckc-it-club-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Bước 5: Chạy Migrations & Seeders

```bash
# Chạy migrations và seeders
php artisan migrate:fresh --seed
php artisan db:seed --class=FactoryDataSeeder
```

#### Bước 6: Start Backend Server

```bash
php artisan serve
```

#### Bước 7: Kiểm tra Backend

Mở browser và truy cập:

```
http://localhost:8000/api/v1/health
```

Nếu thấy response:

```json
{
	"success": true,
	"message": "API is running",
	"version": "v1",
	"timestamp": "2026-02-12T10:30:45Z"
}
```

→ **Backend đã chạy thành công!** ✅

---

### 3️⃣ Setup Frontend (React + Vite)

#### Bước 1: Cài đặt Dependencies

```bash
# Từ root project, cd vào frontend
cd frontend/user

# Install dependencies
npm install
```

#### Bước 2: Cấu hình Environment

**Tạo file `.env` và thêm:**

```env
VITE_API_URL=http://localhost:8000/api/v1
```

#### Bước 3: Start Development Server

```bash
# Start Vite dev server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

#### Bước 4: Kiểm tra Frontend

Mở browser và truy cập:

```
http://localhost:5173
```

→ **Frontend đã chạy thành công!** ✅

---

## ☁️ Kiến Trúc Storage (Supabase)

Hệ thống sử dụng **Supabase Storage** làm kho lưu trữ file chính (thay vì local storage). Các file upload (avatar, image, pdf, import) được tải trực tiếp lên Supabase, và database chỉ lưu đường dẫn public (URL tuyệt đối).

### Cấu Hình Bắt Buộc

Cập nhật thông tin Supabase trong `.env`:

```env
SUPABASE_URL="https://<id>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_IMAGE_BUCKET="images"
SUPABASE_FILE_BUCKET="files"
```

### Cấu Trúc Bucket

- **Bucket `images` (Public):** Lưu trữ hình ảnh với các thư mục: `avatars`, `blog`, `certificate`, `channels`, `chat-rooms`, `club-info`, `community`, `course`, `covers`, `event`, `rank`.
- **Bucket `files` (Private/Public):** Lưu trữ tài liệu, file import/export: `imports`, `certificates`.
