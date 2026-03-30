import { useCategoryStore } from '../../store/useCategoryStore';

interface CategoryBadgeProps {
  categoryId: string | null;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ categoryId, size = 'sm' }: CategoryBadgeProps) {
  const categories = useCategoryStore(s => s.categories);
  const category = categories.find(c => c.id === categoryId);

  if (!category) {
    return (
      <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-500 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
        Uncategorized
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      style={{ backgroundColor: category.color + '20', color: category.color }}
    >
      {category.name}
    </span>
  );
}
