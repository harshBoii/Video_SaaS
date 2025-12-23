// components/asset-library/ViewToggle.jsx
import { LayoutGrid, LayoutList } from 'lucide-react';

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--glass-hover)] rounded-xl">
      <button
        onClick={() => onChange('grid')}
        className={`p-2 rounded-lg transition-all ${
          view === 'grid' 
            ? 'bg-background shadow-sm text-primary' 
            : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-active)]'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-lg transition-all ${
          view === 'list' 
            ? 'bg-background shadow-sm text-primary' 
            : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-active)]'
        }`}
      >
        <LayoutList className="w-5 h-5" />
      </button>
    </div>
  );
}
