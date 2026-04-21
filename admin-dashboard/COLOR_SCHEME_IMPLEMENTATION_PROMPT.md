# Color Scheme & Dashboard UI Implementation Prompt

## Primary and Secondary Colors

### Color Palette

**Primary Color (Main Brand Color):**
- Main: `#20b1aa` (Teal/Turquoise)
- Use for: Primary buttons, headers, navigation active states, main CTAs, table headers, focus states, links

**Secondary Color (Accent Color):**
- Main: `#fea501` (Orange/Amber)
- Use for: Secondary actions, highlights, status badges (PICKED_UP, IN_TRANSIT), accent elements

### Tailwind Configuration

Add this to your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7f6',
          100: '#b3ebe8',
          200: '#80ded9',
          300: '#4dd1ca',
          400: '#26c7bf',
          500: '#20b1aa', // Main primary color
          600: '#1d9f99',
          700: '#198c87',
          800: '#157975',
          900: '#0e5955',
        },
        secondary: {
          50: '#fff4e0',
          100: '#ffe3b3',
          200: '#ffd180',
          300: '#ffbf4d',
          400: '#ffb126',
          500: '#fea501', // Main secondary color
          600: '#e69401',
          700: '#cc8301',
          800: '#b37201',
          900: '#8a5500',
        },
      },
    },
  },
  plugins: [],
}
```

## Color Usage Guidelines

### Primary Color Usage (`#20b1aa` / `primary-500`)

**Buttons:**
- Use gradient: `bg-gradient-to-r from-primary-500 to-primary-600`
- Hover: `hover:from-primary-600 hover:to-primary-700`
- Disabled: `disabled:from-primary-300 disabled:to-primary-400`
- Add shadow: `shadow-md` or `shadow-sm`

**Headers & Navigation:**
- Background: `bg-gradient-to-r from-primary-50 to-primary-100`
- Borders: `border-primary-200` or `border-primary-500`
- Active nav items: `bg-primary-50 text-primary-600`
- Table headers: `bg-gradient-to-r from-primary-500 to-primary-600`

**Input Fields:**
- Focus ring: `focus:ring-2 focus:ring-primary-500`
- Focus border: `focus:border-primary-500`
- Border: `border-primary-200` (for styled inputs)

**Links & Text:**
- Links: `text-primary-600 hover:text-primary-700`
- Icons: `text-primary-400` or `text-primary-600`

**Loading Spinners:**
- Border: `border-primary-200 border-t-primary-500`

### Secondary Color Usage (`#fea501` / `secondary-500`)

**Status Badges:**
- PICKED_UP: `bg-gradient-to-r from-secondary-400 to-secondary-600`
- IN_TRANSIT: `bg-gradient-to-r from-secondary-400 to-secondary-600`
- Collected Amount cards: Use secondary color

**Accent Elements:**
- Secondary buttons (if needed)
- Highlight important information
- Progress indicators

### Status Color Guidelines

**Keep these standard colors for status:**
- DELIVERED: `bg-gradient-to-r from-green-400 to-green-600` (Green)
- ASSIGNED: `bg-gradient-to-r from-primary-400 to-primary-600` (Primary/Teal)
- PICKED_UP: `bg-gradient-to-r from-secondary-400 to-secondary-600` (Secondary/Orange)
- IN_TRANSIT: `bg-gradient-to-r from-secondary-400 to-secondary-600` (Secondary/Orange)
- CANCELLED: `bg-gradient-to-r from-red-400 to-red-600` (Red)
- Default: `bg-gradient-to-r from-gray-400 to-gray-600` (Gray)

## Dashboard UI Design Patterns

### 1. Header Section (Fixed/Sticky)

```jsx
<div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
  {/* Header content */}
</div>
```

**Characteristics:**
- Light gradient background using primary-50 to primary-100
- Border using primary-200
- Compact padding (pb-2, pt-2)
- Shadow for depth

### 2. Stat Cards

```jsx
<div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-2 border border-gray-100">
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md">
      {/* Icon */}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-primary-600 mb-0.5 truncate">{label}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  </div>
</div>
```

**Characteristics:**
- Compact design (p-2)
- Icon with gradient background (primary or secondary)
- Label in primary-600
- Value in bold gray-900
- Hover shadow effect

### 3. Table Headers

```jsx
<thead className="bg-gradient-to-r from-primary-500 to-primary-600">
  <tr>
    <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
      {/* Header text */}
    </th>
  </tr>
</thead>
```

**Characteristics:**
- Gradient background (primary-500 to primary-600)
- White bold text
- Uppercase with tracking
- Compact padding

### 4. Buttons

**Primary Button:**
```jsx
<button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md">
  Button Text
</button>
```

**Secondary Button (if needed):**
```jsx
<button className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-4 py-2 rounded-lg hover:from-secondary-600 hover:to-secondary-700 transition-all shadow-md">
  Button Text
</button>
```

**Characteristics:**
- Always use gradients
- Smooth hover transitions
- Shadow for depth
- Rounded corners (rounded-lg)

### 5. Input Fields

```jsx
<input
  className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
/>
```

**Characteristics:**
- Focus ring in primary-500
- Focus border in primary-500
- Compact sizing for dashboard

### 6. Status Badges

```jsx
<span className="px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-primary-400 to-primary-600 text-white">
  Status Text
</span>
```

**Characteristics:**
- Gradient backgrounds
- Rounded-full
- Bold text
- Shadow for depth
- White text on colored background

### 7. Loading Spinners

```jsx
<div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500"></div>
```

**Characteristics:**
- Light border (primary-200)
- Top border in primary-500
- Smooth animation

### 8. Row Hover Effects

```jsx
<tr className="hover:bg-primary-50 transition-colors border-b border-gray-100">
```

**Characteristics:**
- Subtle primary-50 background on hover
- Smooth transition
- Light border between rows

## Implementation Checklist

### Step 1: Update Tailwind Config
- [ ] Add primary color palette (50-900)
- [ ] Add secondary color palette (50-900)

### Step 2: Replace Existing Colors
- [ ] Replace all `bg-blue-*` with `bg-primary-*` or gradients
- [ ] Replace all `text-blue-*` with `text-primary-*`
- [ ] Replace all `border-blue-*` with `border-primary-*`
- [ ] Replace `bg-orange-*` (for accents) with `bg-secondary-*`
- [ ] Update focus states to use `focus:ring-primary-500`

### Step 3: Update Components
- [ ] Buttons: Use gradient backgrounds
- [ ] Headers: Use primary gradient backgrounds
- [ ] Navigation: Active state in primary colors
- [ ] Tables: Header in primary gradient
- [ ] Inputs: Focus states in primary
- [ ] Links: Use primary-600 with hover to primary-700
- [ ] Loading spinners: Use primary colors

### Step 4: Dashboard Specific
- [ ] Header section with primary gradient background
- [ ] Stat cards with compact design and primary/secondary icons
- [ ] Table with primary gradient header
- [ ] Status badges with appropriate colors
- [ ] Row hover effects in primary-50

### Step 5: Consistency Check
- [ ] All primary actions use primary colors
- [ ] All secondary actions use secondary colors
- [ ] Status colors are consistent (green for success, red for error, etc.)
- [ ] Gradients are used consistently
- [ ] Shadows are applied appropriately
- [ ] Transitions are smooth

## Example Component Structure

```jsx
// Example Dashboard Page Structure
<div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
  {/* Fixed Header */}
  <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
    <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 mt-4 flex-shrink-0">
    <StatCard icon={Icon} label="Label" value={value} color="primary" />
  </div>

  {/* Scrollable Content */}
  <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
    <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-primary-50">
      <h2>Content Title</h2>
    </div>
    <div className="overflow-auto flex-1 min-h-0">
      {/* Scrollable table/content */}
    </div>
  </div>
</div>
```

## Key Design Principles

1. **Gradients Everywhere**: Use gradients for buttons, headers, and important elements
2. **Consistent Shadows**: Use `shadow-sm`, `shadow-md`, or `shadow-lg` appropriately
3. **Smooth Transitions**: Add `transition-all` or `transition-colors` to interactive elements
4. **Compact Design**: Use smaller padding (p-2, p-3) for dashboard elements
5. **Color Hierarchy**: Primary for main actions, secondary for accents, standard colors for status
6. **Hover States**: Always include hover effects with darker shades
7. **Focus States**: Use primary-500 for focus rings and borders

## Color Reference Quick Guide

| Element | Color Class | Hex Value |
|---------|-------------|-----------|
| Primary Button | `from-primary-500 to-primary-600` | #20b1aa |
| Primary Hover | `from-primary-600 to-primary-700` | Darker teal |
| Secondary Button | `from-secondary-500 to-secondary-600` | #fea501 |
| Header Background | `from-primary-50 to-primary-100` | Light teal |
| Active Nav | `bg-primary-50 text-primary-600` | Light bg, medium text |
| Table Header | `from-primary-500 to-primary-600` | #20b1aa |
| Focus Ring | `ring-primary-500` | #20b1aa |
| Links | `text-primary-600` | #20b1aa |

---

**Note**: This color scheme creates a modern, professional look with the teal primary color providing a calm, trustworthy feel, while the orange secondary adds energy and highlights important actions.
