import { useUIStore } from '../../store/useUIStore';
import { CalendarRange, X } from 'lucide-react';

export function Header() {
  const { dateRange, setDateRange } = useUIStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <CalendarRange size={18} className="text-gray-400" />
        <input
          type="date"
          value={dateRange?.start ?? ''}
          onChange={(e) =>
            setDateRange({
              start: e.target.value,
              end: dateRange?.end ?? e.target.value,
            })
          }
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateRange?.end ?? ''}
          onChange={(e) =>
            setDateRange({
              start: dateRange?.start ?? e.target.value,
              end: e.target.value,
            })
          }
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
        {dateRange && (
          <button
            onClick={() => setDateRange(null)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400"
            title="Clear date filter"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
