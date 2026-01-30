interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ value, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 80) return { stroke: '#10b981', bg: '#d1fae5' }; // green
    if (value >= 60) return { stroke: '#f59e0b', bg: '#fef3c7' }; // amber
    return { stroke: '#ef4444', bg: '#fee2e2' }; // red
  };

  const colors = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{value}%</span>
        <span className="text-xs text-gray-500">Attendance</span>
      </div>
    </div>
  );
}
