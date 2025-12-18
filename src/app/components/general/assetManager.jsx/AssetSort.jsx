// components/asset-library/AssetSort.jsx
export default function AssetSort({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
    >
      <option value="createdAt-desc">Newest First</option>
      <option value="createdAt-asc">Oldest First</option>
      <option value="title-asc">Title (A-Z)</option>
      <option value="title-desc">Title (Z-A)</option>
      <option value="size-desc">Largest First</option>
      <option value="size-asc">Smallest First</option>
    </select>
  );
}
