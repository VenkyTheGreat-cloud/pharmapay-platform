# Quick Color Implementation Guide

## Colors
- **Primary**: `#20b1aa` (Teal) - Use for buttons, headers, navigation, main actions
- **Secondary**: `#fea501` (Orange) - Use for accents, highlights, secondary actions

## Tailwind Config
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

## Quick Replacements
- `bg-blue-600` → `bg-gradient-to-r from-primary-500 to-primary-600`
- `hover:bg-blue-700` → `hover:from-primary-600 hover:to-primary-700`
- `text-blue-600` → `text-primary-600`
- `border-blue-600` → `border-primary-500`
- `focus:ring-blue-500` → `focus:ring-primary-500`
- `bg-orange-*` (accents) → `bg-secondary-*`

## Common Patterns

**Button:**
```jsx
className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
```

**Header:**
```jsx
className="bg-gradient-to-r from-primary-50 to-primary-100 border-b-2 border-primary-200"
```

**Table Header:**
```jsx
className="bg-gradient-to-r from-primary-500 to-primary-600 text-white"
```

**Input Focus:**
```jsx
className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
```

**Status Badges:**
- ASSIGNED: `from-primary-400 to-primary-600`
- PICKED_UP/IN_TRANSIT: `from-secondary-400 to-secondary-600`
- DELIVERED: `from-green-400 to-green-600`
- CANCELLED: `from-red-400 to-red-600`
