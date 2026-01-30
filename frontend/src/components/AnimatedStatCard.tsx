import { LucideIcon } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'indigo' | 'green' | 'red' | 'yellow' | 'blue';
  suffix?: string;
}

const colorClasses = {
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
};

export default function AnimatedStatCard({ title, value, icon: Icon, color, suffix = '' }: AnimatedStatCardProps) {
  const animatedValue = useAnimatedNumber(value, 800);
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums">
            {animatedValue}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
