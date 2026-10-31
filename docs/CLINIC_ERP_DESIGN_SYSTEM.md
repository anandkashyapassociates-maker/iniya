# Iniya Clinic ERP Design System Standards

This document specifies the unified design system, typography, components, color conventions, and layout standards for the Iniya Clinic ERP frontend application. All new and modified frontend views must strictly adhere to these guidelines.

---

## 1. Typography & Hierarchy

- **Font Stacks:**
  - **Body / Primary Sans:** `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - **Headings:** `'Plus Jakarta Sans', sans-serif` (letter-spacing: `-0.022em`, font-weight: `700` or `600`)
  - **Monospace / Digits / Codes:** `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`

- **Typography Utilities (from `frontend/src/index.css`):**
  - `.font-display`: Plus Jakarta Sans with tracking `-0.025em` for crisp executive titles.
  - `.tabular-numbers`: `font-variant-numeric: tabular-nums` for aligned financial and numeric data.
  - `.micro-label`: `letter-spacing: 0.075em; font-weight: 700; text-transform: uppercase;` for badges, table column headers, and stat card categories.

- **Heading Hierarchy Guidelines:**
  - **Page Primary Title:** `text-lg sm:text-xl font-bold font-display text-slate-800 tracking-tight` (subtle and refined, avoid oversized or aggressive text).
  - **Section Title:** `text-xs sm:text-sm font-bold font-display text-slate-800 tracking-tight`.
  - **Card / Group Title:** `text-xs font-semibold text-slate-700 tracking-wide uppercase micro-label`.
  - **Body Text:** `text-xs sm:text-sm text-slate-600 font-normal leading-relaxed`.
  - **Muted / Subtitle Text:** `text-[11px] sm:text-xs text-slate-400 font-normal`.

---

## 2. Color System & Theme Palette

The application uses an accessible, modern slate and blue clinical theme with semantic status tokens:

| Semantic Role | Background | Text / Icon | Border | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `bg-slate-50` (`#f8fafc`) | `text-slate-900` | `border-slate-200` | Application root body background |
| **Primary Action** | `bg-blue-600` / `from-blue-600 to-indigo-600` | `text-white` | `border-blue-600` | Primary buttons, active tabs, main links |
| **Surface Card** | `bg-white` | `text-slate-800` | `border-slate-200/90` | Content containers, forms, tables |
| **Active / Success** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Active records, confirmed status, verified desks |
| **Inactive / Pending** | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Pending approvals, dormant records, warnings |
| **Danger / Restricted** | `bg-rose-50` | `text-rose-700` | `border-rose-200` | Blocked users, cancelled appointments, delete actions |
| **Executive / Special** | `bg-purple-50` | `text-purple-700` | `border-purple-200` | SuperAdmin modules, category management, security logs |

---

## 3. Shared React Components Catalog

Always reuse the following components from `frontend/src/components/`:

1. **`StatCard.jsx`**
   - **Path:** `frontend/src/components/StatCard.jsx`
   - **Props:** `title`, `value`, `subtitle`, `icon`, `colorScheme` (`blue` | `emerald` | `amber` | `violet` | `rose`)
   - **Usage:** Executive dashboards, summary KPI headers.

2. **`DataTable.jsx`**
   - **Path:** `frontend/src/components/DataTable.jsx`
   - **Props:** `columns`, `data`, `isLoading`, `searchValue`, `onSearchChange`, `searchPlaceholder`, `pagination`, `onPageChange`, `extraHeaderActions`, `emptyTitle`, `emptyDescription`
   - **Usage:** All list views, patient directories, category registries, admin lists.

3. **`ConfirmDialog.jsx`**
   - **Path:** `frontend/src/components/ConfirmDialog.jsx`
   - **Props:** `isOpen`, `title`, `message`, `confirmText`, `cancelText`, `isDangerous`, `isLoading`, `onConfirm`, `onCancel`
   - **Usage:** Record deletions, cancellations, status toggle confirmations.

4. **`LoadingState.jsx` & `EmptyState.jsx`**
   - **Paths:** `frontend/src/components/LoadingState.jsx`, `frontend/src/components/EmptyState.jsx`
   - **Usage:** Loading spinners and empty state placeholders.

5. **`ClinicArtwork.jsx`**
   - **Path:** `frontend/src/components/ClinicArtwork.jsx`
   - **Components:** `ClinicHeartbeatLine`, `ClinicAuthIllustration`, `ClinicDashboardBannerIllustration`, `ClinicStethoscopeCardIllustration`, `ClinicCrossBadge`
   - **Usage:** Clinical dashboards, banners, login artwork, mission cards.

6. **`MiniCharts.jsx`**
   - **Path:** `frontend/src/components/MiniCharts.jsx`
   - **Components:** `SplineAreaChart` (interactive cubic Bézier area graph), `MultiSegmentDonut` (circular status breakdown with legend), `StatWaveSparkline` (smooth sine-wave SVG sparkline for KPI cards), `ActivityBarChart`, `DonutMetric`, `AnimatedProgressBar`.
   - **Usage:** Executive overview dashboards, financial metrics, distribution statistics.

7. **`DashboardSkeleton.jsx`**
   - **Path:** `frontend/src/components/DashboardSkeleton.jsx`
   - **Usage:** Smooth shimmer loader matching the exact 6-card + 3-col + 3-col dashboard grid.

---

## 4. UI Elements & Form Standards

- **Cards & Containers:**
  ```jsx
  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
    {/* Card Content */}
  </div>
  ```

- **Buttons:**
  - **Primary Action:**
    ```jsx
    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-950/20 transition-all cursor-pointer font-display">
      <UserPlus className="w-3.5 h-3.5" />
      <span>+ Add Record</span>
    </button>
    ```
  - **Secondary / Cancel Button:**
    ```jsx
    <button className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-2xs cursor-pointer font-display">
      Cancel
    </button>
    ```
  - **Destructive Button:**
    ```jsx
    <button className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer">
      Delete Record
    </button>
    ```

- **Form Input Fields:**
  ```jsx
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      Field Label <span className="text-rose-500">*</span>
    </label>
    <div className="relative">
      <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
      />
    </div>
  </div>
  ```

- **Status Badges:**
  ```jsx
  // Active
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
    Active
  </span>

  // Inactive
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
    Inactive
  </span>

  // Blocked / Cancelled
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
    Blocked
  </span>
  ```

---

## 5. Layout Architecture

1. **Admin Layout (`frontend/src/layouts/AdminLayout.jsx`):**
   - Houses clinical clinic features (`Patient Directory`, `Appointments`, `Categories`, `Profile`).
   - Uses `Sidebar.jsx` (collapsible on mobile, fixed on desktop) and `Topbar.jsx` (glassmorphism blur, quick action shortcuts, admin profile menu).

2. **SuperAdmin Layout (`frontend/src/superadmin/layouts/SuperAdminLayout.jsx`):**
   - Houses executive system oversight (`Admin Management`, `Staff`, `Vendors`, `Sales Team`, `Category Registry`).
   - Uses dark executive sidebar with collapsible accordions and high-contrast blue/slate accents.

---

## 6. Implementation Checklist for New Views

- [ ] Inspect existing sibling pages for exact props and layout.
- [ ] Reuse existing `DataTable`, `StatCard`, `ConfirmDialog`, `LoadingState`, `EmptyState`.
- [ ] Use `font-display`, `micro-label`, and `tabular-numbers` classes where appropriate.
- [ ] Maintain consistent `rounded-2xl` / `rounded-3xl` corner radii.
- [ ] Ensure full mobile responsiveness (grid-cols-1 to sm:grid-cols-2 to lg:grid-cols-4).
- [ ] Preserve existing API services, error boundaries, and token authorization.

