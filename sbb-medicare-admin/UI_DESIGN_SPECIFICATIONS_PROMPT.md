# UI Design Specifications Prompt for Web Application

## Color Scheme

### Primary Color (Main Brand)
- **Hex Code**: `#20b1aa` (Teal/Turquoise)
- **Tailwind Class**: `primary-500`
- **Usage**: Main buttons, headers, navigation, table headers, links, focus states

### Secondary Color (Accent)
- **Hex Code**: `#fea501` (Orange/Amber)
- **Tailwind Class**: `secondary-500`
- **Usage**: Secondary actions, highlights, status badges (PICKED_UP, IN_TRANSIT), accent elements

### Tailwind Configuration
```javascript
colors: {
  primary: {
    50: '#e0f7f6', 100: '#b3ebe8', 200: '#80ded9', 300: '#4dd1ca',
    400: '#26c7bf', 500: '#20b1aa', 600: '#1d9f99', 700: '#198c87',
    800: '#157975', 900: '#0e5955',
  },
  secondary: {
    50: '#fff4e0', 100: '#ffe3b3', 200: '#ffd180', 300: '#ffbf4d',
    400: '#ffb126', 500: '#fea501', 600: '#e69401', 700: '#cc8301',
    800: '#b37201', 900: '#8a5500',
  },
}
```

## Text Size Specifications

### Page Titles
- **Size**: `text-lg` (18px)
- **Weight**: `font-bold`
- **Color**: `text-gray-800`
- **Example**: `<h1 className="text-lg font-bold text-gray-800">Page Title</h1>`

### Page Subtitles
- **Size**: `text-xs` (12px)
- **Weight**: `font-normal`
- **Color**: `text-gray-600`
- **Example**: `<p className="text-xs text-gray-600">Subtitle text</p>`

### Table Headers
- **Size**: `text-xs` (12px)
- **Weight**: `font-bold`
- **Color**: `text-white` (on colored background)
- **Case**: `uppercase`
- **Tracking**: `tracking-wider`
- **Example**: `<th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">Header</th>`

### Table Content Text
- **Size**: `text-xs` (12px)
- **Weight**: `font-medium` (for important data) or `font-normal`
- **Color**: `text-gray-900` (main), `text-gray-700` (secondary), `text-gray-600` (tertiary)
- **Example**: `<td className="px-4 py-3 text-xs text-gray-900">Content</td>`

### Button Text
- **Size**: `text-xs` (12px)
- **Weight**: `font-medium`
- **Color**: `text-white` (on colored buttons)
- **Example**: `<button className="text-xs font-medium">Button</button>`

### Input Labels
- **Size**: `text-xs` (12px)
- **Weight**: `font-medium`
- **Color**: `text-gray-600`
- **Example**: `<label className="text-xs font-medium text-gray-600">Label</label>`

### Input Text
- **Size**: `text-xs` (12px)
- **Color**: `text-gray-700`
- **Example**: `<input className="text-xs" />`

### Loading Text
- **Size**: `text-sm` (14px)
- **Color**: `text-gray-600`
- **Example**: `<p className="text-sm text-gray-600">Loading...</p>`

### Status Badge Text
- **Size**: `text-xs` (12px)
- **Weight**: `font-bold`
- **Color**: `text-white` (on colored backgrounds)
- **Example**: `<span className="text-xs font-bold text-white">Status</span>`

## Layout Specifications

### Main Container
```jsx
<div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
  {/* Content */}
</div>
```

### Fixed Header Section
```jsx
<div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div>
      <h1 className="text-lg font-bold text-gray-800">Page Title</h1>
      <p className="text-xs text-gray-600">Subtitle</p>
    </div>
  </div>
</div>
```

### Scrollable Content Area
```jsx
<div className="flex flex-col flex-1 min-h-0">
  {/* Scrollable content */}
  <div className="overflow-auto flex-1 min-h-0">
    {/* Table or list content */}
  </div>
</div>
```

## Component Specifications

### Primary Button
```jsx
<button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm">
  Button Text
</button>
```

**Characteristics:**
- Gradient background (primary-500 to primary-600)
- Text size: `text-xs`
- Padding: `px-3 py-1.5` (compact)
- Shadow: `shadow-sm`
- Hover: Darker gradient

### Table Structure
```jsx
<div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
  <div className="overflow-auto flex-1 min-h-0">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
        <tr>
          <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
            Header
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-primary-50 transition-colors border-b border-gray-100">
          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
            Content
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Table Specifications:**
- Header: Primary gradient background, white bold text, `text-xs`
- Header padding: `px-4 py-2.5`
- Row padding: `px-4 py-3`
- Row text: `text-xs`
- Row hover: `hover:bg-primary-50`
- Border: `border-b border-gray-100`

### Input Fields
```jsx
<input
  className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
/>
```

**Input Specifications:**
- Text size: `text-xs`
- Padding: `px-2 py-1` (compact)
- Focus ring: `focus:ring-2 focus:ring-primary-500`
- Focus border: `focus:border-primary-500`

### Status Badges
```jsx
<span className="px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-primary-400 to-primary-600 text-white">
  Status Text
</span>
```

**Status Badge Colors:**
- ASSIGNED: `from-primary-400 to-primary-600`
- PICKED_UP/IN_TRANSIT: `from-secondary-400 to-secondary-600`
- DELIVERED: `from-green-400 to-green-600`
- CANCELLED: `from-red-400 to-red-600`
- Default: `from-gray-400 to-gray-600`

### Icons
- **Size**: `w-4 h-4` (16px) for table actions
- **Size**: `w-3.5 h-3.5` (14px) for compact buttons
- **Color**: Match text color (e.g., `text-primary-600`)

### Loading Spinner
```jsx
<div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-500"></div>
```

**Specifications:**
- Size: `h-10 w-10`
- Border: `border-4`
- Colors: `border-primary-200 border-t-primary-500`

## Spacing Specifications

### Page Padding
- Main container: `p-4` (16px)

### Section Margins
- Between sections: `mb-4` (16px)
- Between header and content: `mb-4` (16px)
- Top margin for stats: `mt-4` (16px)

### Card Padding
- Compact cards: `p-2` (8px)
- Standard cards: `p-3` (12px)
- Large cards: `p-4` (16px)

### Gap Between Elements
- Small gaps: `gap-2` (8px)
- Medium gaps: `gap-3` (12px)
- Large gaps: `gap-4` (16px)

## Color Usage Guidelines

### Primary Color Usage
- **Buttons**: `bg-gradient-to-r from-primary-500 to-primary-600`
- **Headers**: `bg-gradient-to-r from-primary-50 to-primary-100`
- **Table Headers**: `bg-gradient-to-r from-primary-500 to-primary-600`
- **Links**: `text-primary-600 hover:text-primary-700`
- **Focus States**: `focus:ring-primary-500 focus:border-primary-500`
- **Borders**: `border-primary-200` or `border-primary-500`
- **Hover Backgrounds**: `hover:bg-primary-50`

### Secondary Color Usage
- **Accent Buttons**: `bg-gradient-to-r from-secondary-500 to-secondary-600`
- **Status Badges**: `from-secondary-400 to-secondary-600` (for PICKED_UP, IN_TRANSIT)
- **Highlights**: Use for important secondary information

## Typography Scale

| Element | Size Class | Pixel Size | Weight | Color |
|---------|-----------|------------|--------|-------|
| Page Title | `text-lg` | 18px | `font-bold` | `text-gray-800` |
| Page Subtitle | `text-xs` | 12px | `font-normal` | `text-gray-600` |
| Table Header | `text-xs` | 12px | `font-bold` | `text-white` |
| Table Content | `text-xs` | 12px | `font-medium` | `text-gray-900` |
| Button Text | `text-xs` | 12px | `font-medium` | `text-white` |
| Input Text | `text-xs` | 12px | `font-normal` | `text-gray-700` |
| Label Text | `text-xs` | 12px | `font-medium` | `text-gray-600` |
| Status Badge | `text-xs` | 12px | `font-bold` | `text-white` |
| Loading Text | `text-sm` | 14px | `font-normal` | `text-gray-600` |

## Complete Page Template

```jsx
<div className="p-4 h-screen flex flex-col overflow-hidden bg-gray-100">
  {/* Fixed Header */}
  <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 -mx-4 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0 mb-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Page Title</h1>
        <p className="text-xs text-gray-600">Page subtitle</p>
      </div>
      <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm">
        Action Button
      </button>
    </div>
  </div>

  {/* Scrollable Content */}
  <div className="flex flex-col flex-1 min-h-0">
    {/* Filters/Search Section */}
    <div className="mb-4 bg-white rounded-lg shadow-sm p-3 flex-shrink-0">
      {/* Filter content */}
    </div>

    {/* Table Section */}
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
      <div className="overflow-auto flex-1 min-h-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                Column Header
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-primary-50 transition-colors border-b border-gray-100">
              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                Table Content
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

## Key Design Principles

1. **Compact Design**: Use smaller text sizes (`text-xs`) and padding (`p-2`, `p-3`, `px-4 py-3`)
2. **Consistent Typography**: All content text uses `text-xs`, only titles use `text-lg`
3. **Primary Color Dominance**: Use primary color for all main UI elements
4. **Gradient Buttons**: Always use gradients for buttons (`from-primary-500 to-primary-600`)
5. **Subtle Shadows**: Use `shadow-sm` or `shadow-md` for depth
6. **Smooth Transitions**: Add `transition-all` or `transition-colors` to interactive elements
7. **Fixed Headers**: Headers should be `flex-shrink-0` and content should be scrollable
8. **Consistent Spacing**: Use `gap-2`, `gap-3`, `mb-4` consistently
9. **Icon Sizes**: Use `w-4 h-4` for table actions, `w-3.5 h-3.5` for compact buttons
10. **Color Hierarchy**: Primary for main actions, secondary for accents, standard colors for status

## Implementation Checklist

- [ ] Add primary and secondary color palettes to Tailwind config
- [ ] Set all page titles to `text-lg font-bold text-gray-800`
- [ ] Set all subtitles to `text-xs text-gray-600`
- [ ] Set all table headers to `text-xs font-bold text-white` on primary gradient
- [ ] Set all table content to `text-xs`
- [ ] Set all buttons to `text-xs font-medium`
- [ ] Set all inputs to `text-xs`
- [ ] Use primary gradient for all headers (`from-primary-50 to-primary-100`)
- [ ] Use primary gradient for all table headers (`from-primary-500 to-primary-600`)
- [ ] Use primary gradient for all buttons (`from-primary-500 to-primary-600`)
- [ ] Set icon sizes to `w-4 h-4` for tables, `w-3.5 h-3.5` for compact buttons
- [ ] Apply `hover:bg-primary-50` to table rows
- [ ] Use compact padding throughout (`p-4` for pages, `px-4 py-3` for table cells)
- [ ] Ensure all screens have fixed headers with scrollable content

---

**Note**: This design system creates a clean, compact, professional interface with consistent typography and a cohesive color scheme. The small text sizes (`text-xs`) allow for more information density while maintaining readability.
