const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'AIQ': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'State Counselling': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Private Colleges': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Cutoffs': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Guides': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'News': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

export function CategoryBadge({ category, size = 'md', clickable = false }: CategoryBadgeProps) {
  const colors = categoryColors[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2.5 py-1';

  const Component = clickable ? 'a' : 'span';
  const props = clickable ? { href: `/blog/category/${encodeURIComponent(category)}` } : {};

  return (
    <Component
      {...props}
      className={`inline-block ${sizeClasses} ${colors.bg} ${colors.text} border ${colors.border} font-semibold rounded-full whitespace-nowrap ${clickable ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`}
    >
      {category}
    </Component>
  );
}
