import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: { value: number; label: string };
  color?: string;
}

export function MetricCard({ label, value, trend, color }: MetricCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ color: color ?? '#111827' }}
      >
        {value}
      </p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {isPositiveTrend ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
