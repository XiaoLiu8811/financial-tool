import { CategoryManager } from '../components/categories/CategoryManager';

export function CategoriesPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Categories</h2>
      <CategoryManager />
    </div>
  );
}
