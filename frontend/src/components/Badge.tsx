interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'green' | 'red' | 'yellow' | 'indigo';
}

const variants = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-rose-100 text-rose-700',
  yellow: 'bg-amber-100 text-amber-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
