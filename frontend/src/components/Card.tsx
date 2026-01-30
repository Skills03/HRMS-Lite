interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
