import { useState } from 'react';

const FiltersBar = ({ initialValues = {}, onApply, onReset }) => {
  // Create initial filters from initialValues (only used for initial state)
  const getInitialFilters = () => ({
    q: initialValues.q || '',
    minPrice: initialValues.minPrice || '',
    maxPrice: initialValues.maxPrice || '',
    currency: initialValues.currency || '',
  });

  // Use lazy initialization - state is only set once on mount
  // If parent needs to reset filters, it should remount this component with a key
  const [filters, setFilters] = useState(getInitialFilters);

  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    onApply(values);
  };

  const handleReset = () => {
    setFilters({
      q: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
    });
    onReset();
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Search
          </label>
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder="Search..."
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Min Price
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            placeholder="Min"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Max Price
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            placeholder="Max"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Currency
          </label>
          <select
            value={filters.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All Currencies</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MDL">MDL</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;

