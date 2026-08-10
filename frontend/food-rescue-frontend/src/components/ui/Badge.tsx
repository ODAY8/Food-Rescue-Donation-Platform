interface BadgeProps {
  label: string;
  color?: 'green' | 'orange' | 'red' | 'gray' | 'blue';
}

const colors = {
  green: 'bg-[#d8f3dc] text-[#2d6a4f]',
  orange: 'bg-[#fde8df] text-[#c0522a]',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
};

export default function Badge({ label, color = 'green' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}
