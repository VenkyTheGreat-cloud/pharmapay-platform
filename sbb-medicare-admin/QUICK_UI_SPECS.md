# Quick UI Specifications Reference

## Colors
- **Primary**: `#20b1aa` (Teal) - `primary-500`
- **Secondary**: `#fea501` (Orange) - `secondary-500`

## Text Sizes (All Compact)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | `text-lg` | `font-bold` | `text-gray-800` |
| Subtitle | `text-xs` | normal | `text-gray-600` |
| Table Header | `text-xs` | `font-bold` | `text-white` |
| Table Content | `text-xs` | `font-medium` | `text-gray-900` |
| Button | `text-xs` | `font-medium` | `text-white` |
| Input | `text-xs` | normal | `text-gray-700` |
| Label | `text-xs` | `font-medium` | `text-gray-600` |

## Key Patterns

**Header:**
```jsx
<div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200">
  <h1 className="text-lg font-bold text-gray-800">Title</h1>
  <p className="text-xs text-gray-600">Subtitle</p>
</div>
```

**Table Header:**
```jsx
<thead className="bg-gradient-to-r from-primary-500 to-primary-600">
  <th className="px-4 py-2.5 text-xs font-bold text-white uppercase">Header</th>
</thead>
```

**Table Row:**
```jsx
<tr className="hover:bg-primary-50">
  <td className="px-4 py-3 text-xs text-gray-900">Content</td>
</tr>
```

**Button:**
```jsx
<button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg">
  Button
</button>
```

**Icons:** `w-4 h-4` (tables), `w-3.5 h-3.5` (compact)

**Padding:** `p-4` (pages), `px-4 py-3` (table cells), `px-3 py-1.5` (buttons)
