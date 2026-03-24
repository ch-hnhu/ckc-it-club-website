# Dashboard Modernization Guide

## Overview

Giao diện admin dashboard đã được cập nhật theo kiểu **minimal, clean design** với:
- **Màu chủ đạo**: `#2e3820` (Dark Olive Green)
- **Style**: Minimal trắng-đen với border
- **Components**: Sử dụng shadcn/ui + Tailwind CSS
- **Framework**: React + Vite

## Cấu trúc thư mục

```
frontend/admin/src/
├── components/
│   ├── dashboard/
│   │   ├── StatCard.tsx         # Card hiển thị số liệu
│   │   ├── ChartCard.tsx        # Container cho biểu đồ
│   │   ├── SimpleChart.tsx      # Biểu đồ (Line/Bar)
│   │   ├── RecentActivity.tsx   # Hoạt động gần đây
│   │   └── StatsGrid.tsx        # Grid 4 stat cards
│   └── partials/
│       ├── Header.tsx           # Header navbar
│       ├── Sidebar.tsx          # Sidebar navigation
│       └── Footer.tsx           # Footer
├── pages/
│   ├── Dashboard.tsx            # Main dashboard page
│   └── Demo.tsx                 # Demo page
├── layouts/
│   └── MainLayout.tsx           # Layout wrapper
└── index.css                    # Global styles + theme

components/ui/                   # Shadcn/ui components (shared)
├── card.tsx
├── button.tsx
└── ... (other shadcn components)
```

## Màu sắc Hệ thống

```css
Primary:      #2e3820  (Dark Olive Green)
Primary Dark: #1f2817
Primary Light: #4a5630

White:        #ffffff
Black:        #1a1a1a
Gray Dark:    #666666
Gray Light:   #e5e5e5
Border:       #e0e0e0
Background:   #f5f5f5 / #f9fafb
```

## Các Component Chính

### 1. StatCard
Hiển thị số liệu thống kê với icon, trend, và tooltip.

```tsx
<StatCard
  icon={<ShoppingCart />}
  title="Total Orders"
  value={150}
  suffix="orders"
  trend={12}
  trendDirection="up"
/>
```

### 2. ChartCard
Container cho biểu đồ với title, description, và action button.

```tsx
<ChartCard
  title="Revenue Trend"
  description="Monthly revenue data"
  action={<button>Export</button>}
>
  <SimpleChart type="line" data={data} dataKey="value" />
</ChartCard>
```

### 3. SimpleChart
Biểu đồ đơn giản sử dụng Recharts (Line hoặc Bar).

```tsx
<SimpleChart
  type="line"    // hoặc "bar"
  data={chartData}
  dataKey="value"
  height={300}
/>
```

### 4. RecentActivity
Danh sách hoạt động gần đây với timestamp và icons.

```tsx
<RecentActivity
  title="Recent Activity"
  items={[
    {
      id: "1",
      title: "Order received",
      description: "Order #123",
      timestamp: "2 hours ago",
      icon: "📦"
    }
  ]}
/>
```

## Tùy chỉnh Giao diện

### Thay đổi Màu Chủ đạo

Tôi đã cấu hình màu chủ đạo qua CSS variables. Để thay đổi, chỉnh sửa trong `/frontend/admin/src/index.css`:

```css
:root {
  --primary: #2e3820;      /* Thay đổi màu chủ đạo */
  --accent: #2e3820;
  /* ... other variables */
}
```

### Thêm New Components

Các component mới được thêm vào `/src/components/dashboard/`:

1. Tạo file mới (e.g., `MyComponent.tsx`)
2. Import shadcn components theo cần
3. Sử dụng tailwind classes với semantic tokens

## Cài đặt và Chạy

### Cài đặt dependencies
```bash
cd frontend/admin
npm install
```

### Chạy dev server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

## CSS Theme System

Toàn bộ giao diện sử dụng **semantic design tokens** thay vì hardcoded colors:

- `bg-white` / `bg-[#ffffff]`
- `text-[#1a1a1a]` (foreground)
- `border-[#e0e0e0]` (border)
- `text-[#666666]` (muted text)
- Màu chủ đạo: `text-[#2e3820]`

Quy tắc Tailwind đã tối ưu:
- ✅ Prefer spacing scale: `p-4`, `gap-6`
- ✅ Responsive: `md:grid-cols-2`, `lg:col-span-2`
- ✅ Semantic classes: `items-center`, `justify-between`
- ✅ Avoid arbitrary values (use spacing scale)

## Responsive Design

Dashboard đang responsive cho:
- Mobile: `< 768px` (1 column)
- Tablet: `768px - 1024px` (2 columns)  
- Desktop: `> 1024px` (3-4 columns)

Grid classes:
```tsx
<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
  {/* Responsive grid */}
</div>
```

## State Management & Data Fetching

Dashboard hiện tại sử dụng:
- **React Hooks** (useState, useEffect)
- **Axios** cho API calls
- **SWR** optional (có thể thêm để caching)

## Accessibility

- Semantic HTML: `<main>`, `<header>`, `<nav>`, `<footer>`
- ARIA labels cho icons
- Proper heading hierarchy (h1, h2, h3)
- Color contrast meets WCAG AA standards
- Keyboard navigation compatible

## Best Practices

1. **Component Composition**: Tách components thành files riêng
2. **Props Interface**: Define PropTypes/TypeScript interfaces
3. **Consistent Styling**: Dùng design tokens thay vì hardcoded colors
4. **Performance**: Lazy load heavy components, memoize where needed
5. **Accessibility**: Add alt text, ARIA labels, semantic HTML

## Troubleshooting

### Recharts không render
- Đảm bảo `recharts` được cài: `npm install recharts`
- Check data format matches expected shape

### Style không apply
- Xác nhận tailwind config có đúng content paths
- Check CSS variables được định nghĩa trong `index.css`
- Rebuild nếu vẫn lỗi: `npm run build`

### Import path errors
- Xác nhận vite.config.ts có đúng alias config
- TypeScript path mapping trong tsconfig.app.json

## Kế tiếp

1. **Add Authentication**: Login, logout, user profile
2. **Add Real Data**: Kết nối API endpoints
3. **Add Notifications**: Toast, alerts, modals
4. **Add Tables**: Data tables với sorting/filtering
5. **Add Forms**: Form validation với React Hook Form

---

**Happy building! 🎉**
