# 🚀 Quick Start Guide - Modern Dashboard

## 1️⃣ Installation

```bash
cd frontend/admin
npm install
```

## 2️⃣ Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## 3️⃣ Build for Production

```bash
npm run build
```

## 📂 Where to Find Things

### Dashboard Page
- **File**: `src/pages/Dashboard.tsx`
- **Live**: `http://localhost:5173/`
- **What it shows**: Main dashboard with stats, charts, and activity

### Style Guide
- **File**: `src/pages/StyleGuide.tsx`
- **What it shows**: Design tokens, colors, typography, components
- **Why view it**: Reference for design consistency

### Components

#### Stats Card
```tsx
import { StatCard } from "@/components/dashboard/StatCard";

<StatCard
  icon={<ShoppingCart />}
  title="Total Orders"
  value={150}
  suffix="orders"
  trend={12}
  trendDirection="up"
/>
```

#### Chart Card
```tsx
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SimpleChart } from "@/components/dashboard/SimpleChart";

<ChartCard title="Revenue">
  <SimpleChart type="line" data={data} dataKey="value" />
</ChartCard>
```

#### Recent Activity
```tsx
import { RecentActivity } from "@/components/dashboard/RecentActivity";

<RecentActivity items={[
  {
    id: "1",
    title: "Order received",
    description: "Order #123",
    timestamp: "2 hours ago",
    icon: "📦"
  }
]} />
```

## 🎨 Styling

### Primary Color: `#2e3820`

Use in Tailwind:
```tsx
<div className='text-[#2e3820]'>Primary Color</div>
<div className='bg-[#2e3820] text-white'>Button</div>
<div className='border-[#2e3820]'>Border</div>
```

### Colors Quick Reference
```
White:       #ffffff
Black:       #1a1a1a
Primary:     #2e3820
Gray Dark:   #666666
Gray Light:  #e5e5e5
Border:      #e0e0e0
```

## 📊 Adding Data

### Update Dashboard with Real Data

1. **Replace mock data in Dashboard.tsx**:
```tsx
const chartData = [
  { name: "Jan", value: 400 },
  // Add your real data here
];
```

2. **Connect to API**:
```tsx
import { useEffect, useState } from "react";

const [data, setData] = useState([]);

useEffect(() => {
  fetch("/api/dashboard/stats")
    .then(res => res.json())
    .then(data => setData(data));
}, []);
```

3. **Use data in components**:
```tsx
<StatCard value={data.orders} ... />
```

## 🔧 Common Tasks

### Change Primary Color

Edit `src/index.css`:
```css
:root {
  --primary: #2e3820;  ← Change this
  --accent: #2e3820;   ← And this
}
```

Then update Tailwind references:
```tsx
// Before
<div className='text-[#2e3820]'>

// After
<div className='text-[#yourColor]'>
```

### Add New Stat Card

```tsx
import { StatCard } from "@/components/dashboard/StatCard";
import { Users } from "lucide-react";

<StatCard
  icon={<Users />}
  title="New Stat"
  value={100}
  trend={5}
  trendDirection="up"
/>
```

### Add New Chart

```tsx
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SimpleChart } from "@/components/dashboard/SimpleChart";

<ChartCard title="My Chart">
  <SimpleChart
    type="line"  // or "bar"
    data={[
      { name: "A", value: 100 },
      { name: "B", value: 200 },
    ]}
    dataKey="value"
  />
</ChartCard>
```

### Update Footer

Edit `src/components/partials/Footer.tsx`:
```tsx
<p className='text-sm mt-1'>© 2024 Your Company.</p>
```

### Change Sidebar Menu

Edit `src/components/partials/Sidebar.tsx`:
```tsx
<li className='nav-item'>
  <a href='/your-page' className='nav-link'>
    <YourIcon className='size-4 m-1' />
    <p>Your Menu Item</p>
  </a>
</li>
```

## 🎯 Next Steps

### 1. Connect API
- [ ] Get API endpoints from backend
- [ ] Replace mock data with API calls
- [ ] Add loading states
- [ ] Add error handling

### 2. Add Authentication
- [ ] Implement login page
- [ ] Add session management
- [ ] Protect routes
- [ ] Add logout functionality

### 3. Add Features
- [ ] Data tables with sorting/filtering
- [ ] User management
- [ ] Reports/exports
- [ ] User settings

### 4. Optimize
- [ ] Add caching with SWR
- [ ] Optimize images
- [ ] Lazy load components
- [ ] Add error boundaries

## 📚 Documentation Links

- [DASHBOARD_GUIDE.md](./DASHBOARD_GUIDE.md) - Comprehensive guide
- [DASHBOARD_CHANGES.md](./DASHBOARD_CHANGES.md) - What was changed
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [StyleGuide.tsx](./frontend/admin/src/pages/StyleGuide.tsx) - Visual design system

## 🆘 Troubleshooting

### Charts not showing
```bash
npm install recharts
npm run dev
```

### Styles not applying
- Clear cache: `Ctrl+Shift+R` (browser)
- Rebuild: `npm run build`
- Check Tailwind content paths in `tailwind.config.ts`

### Import errors
- Check file paths in imports
- Verify vite.config.ts alias paths
- Check tsconfig.app.json path mappings

### Port already in use
```bash
# Kill process on port 5173
# Windows: taskkill /PID [PID] /F
# Mac/Linux: lsof -ti:5173 | xargs kill -9

npm run dev -- --port 3000  # Use different port
```

## 📞 Need Help?

1. Check the error message carefully
2. Search DASHBOARD_GUIDE.md
3. Review component examples in Dashboard.tsx
4. Check browser console for errors
5. Try clearing node_modules and reinstalling

## ✨ Tips & Tricks

### Use Tailwind IntelliSense
- Install VS Code extension: "Tailwind CSS IntelliSense"
- Get color and class autocomplete

### Component Reusability
- Keep components small and focused
- Use TypeScript interfaces for props
- Document props with JSDoc comments

### Performance
- Use React.memo for heavy components
- Lazy load routes with React.lazy
- Use SWR for data fetching

### Accessibility
- Add alt text to images
- Use semantic HTML
- Test with keyboard navigation
- Check color contrast

## 🎓 Resources

- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Recharts Examples](https://recharts.org/examples)
- [Lucide Icons](https://lucide.dev/icons)

---

**Happy coding! 🎉**

For more detailed information, see the full [DASHBOARD_GUIDE.md](./DASHBOARD_GUIDE.md)
