import { useState } from 'react';
import useCategories from '../hooks/useCategories';

const FiltersBar = ({ initialValues = {}, onApply, onReset }) => {
  // Create initial filters from initialValues (only used for initial state)
  const getInitialFilters = () => ({
    q: initialValues.q || '',
    minPrice: initialValues.minPrice || '',
    maxPrice: initialValues.maxPrice || '',
    currency: initialValues.currency || '',
    category: initialValues.category || '',
    subCategory: initialValues.subCategory || '',
  });

  // Use lazy initialization - state is only set once on mount
  // If parent needs to reset filters, it should remount this component with a key
  const [filters, setFilters] = useState(getInitialFilters);
  
  // Categories from API
  const { categories, loading: loadingCategories } = useCategories();

  // Get available subcategories for selected category
  const selectedCategory = categories.find(c => c.slug === filters.category);
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];

  const handleChange = (field, value) => {
    if (field === 'category') {
      // Reset subcategory when category changes
      setFilters((prev) => ({
        ...prev,
        category: value,
        subCategory: '',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleApply = () => {
    // Build values object, only including non-empty values
    const values = {};
    if (filters.q.trim()) {
      values.q = filters.q.trim();
    }
    if (filters.minPrice) {
      values.minPrice = Number(filters.minPrice);
    }
    if (filters.maxPrice) {
      values.maxPrice = Number(filters.maxPrice);
    }
    if (filters.currency && filters.currency.trim() !== '') {
      values.currency = filters.currency;
    }
    if (filters.category && filters.category.trim() !== '') {
      values.categorySlug = filters.category; // Backend expects categorySlug
    }
    if (filters.subCategory && filters.subCategory.trim() !== '') {
      values.subCategorySlug = filters.subCategory; // Backend expects subCategorySlug
    }
    onApply(values);
  };

  const handleReset = () => {
    setFilters({
      q: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
      category: '',
      subCategory: '',
    });
    onReset();
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            🔍 Search
          </label>
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder="Search ads..."
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Min Price
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            placeholder="Min"
            min="0"
            step="0.01"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Max Price
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            placeholder="Max"
            min="0"
            step="0.01"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Currency
          </label>
          <select
            value={filters.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">All Currencies</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MDL">MDL</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            disabled={loadingCategories}
            style={{ width: '100%' }}
          >
            <option value="">{loadingCategories ? 'Loading...' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name || cat.label}
              </option>
            ))}
          </select>
        </div>

        {filters.category && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Subcategory
            </label>
            <select
              value={filters.subCategory}
              onChange={(e) => handleChange('subCategory', e.target.value)}
              disabled={loadingCategories || !filters.category}
              style={{ width: '100%' }}
            >
              <option value="">All Subcategories</option>
              {availableSubcategories.map((subCat) => {
                const subSlug = subCat.slug || subCat;
                const subLabel = subCat.name || subCat.label || subCat;
                return (
                  <option key={subSlug} value={subSlug}>
                    {subLabel}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleApply}
            className="btn-primary"
            style={{ flex: 1, padding: '10px 16px' }}
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px 16px' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;

