// components/asset-library/AssetSort.jsx
import { ArrowUpDown } from 'lucide-react';

export default function AssetSort({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none text-foreground text-sm cursor-pointer"
      >
        <option value="createdAt-desc">Newest First</option>
        <option value="createdAt-asc">Oldest First</option>
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
        <option value="size-desc">Largest First</option>
        <option value="size-asc">Smallest First</option>
      </select>
      <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
