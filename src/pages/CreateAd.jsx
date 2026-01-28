import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAd } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import useCategories from '../hooks/useCategories';
import ImageUploader from '../components/ImageUploader';

const CreateAd = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const { success, error: showError } = useToast();
  
  // Categories from API
  const { categories, loading: loadingCategories, error: categoriesError } = useCategories();
  const [categorySlug, setCategorySlug] = useState('');
  const [subCategorySlug, setSubCategorySlug] = useState('');

  const validate = () => {
    const errors = {};

    // Title: required, min 3 chars
    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    // Description: required, min 20 chars
    if (!description || !description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    // Price: must be finite number > 0
    const priceNum = Number(price);
    if (!price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    // Currency: must be one of ["EUR","USD","MDL"]
    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!currency || !validCurrencies.includes(currency)) {
      errors.currency = 'Currency must be EUR, USD, or MDL';
    }

    // At least 1 image required
    if (images.length === 0) {
      errors.images = 'At least one image is required';
    }

    // Category: required
    if (!categorySlug || !categorySlug.trim()) {
      errors.category = 'Category is required';
    }
    // Subcategory is optional (not required)

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    // Validate category and subcategory before submit
    if (!categorySlug || !categorySlug.trim()) {
      showError('Please select a category.');
      setValidationErrors((prev) => ({ ...prev, category: 'Category is required' }));
      return;
    }

    const selectedCategory = categories.find(c => c.slug === categorySlug);
    if (!selectedCategory) {
      showError('Invalid category selected. Please select a valid category.');
      setValidationErrors((prev) => ({ ...prev, category: 'Invalid category' }));
      return;
    }

    if (subCategorySlug && subCategorySlug.trim()) {
      const subcategories = selectedCategory.subcategories || selectedCategory.subs || [];
      const isValidSub = subcategories.some(sub => {
        const subSlug = sub.slug || sub;
        return subSlug === subCategorySlug;
      });
      if (!isValidSub) {
        showError('Invalid subcategory for the selected category. Please select a valid subcategory.');
        setValidationErrors((prev) => ({ ...prev, subCategory: 'Invalid subcategory' }));
        return;
      }
    }

    setLoading(true);

    try {
      // Build FormData with correct types
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', String(Number(price)));
      formData.append('currency', currency);
      
      // Map category fields - backend expects categorySlug and subCategorySlug
      formData.append('categorySlug', categorySlug);
      if (subCategorySlug && subCategorySlug.trim()) {
        formData.append('subCategorySlug', subCategorySlug);
      } else {
        // Don't send subCategorySlug if empty
      }

      // Dev log
      if (import.meta.env.DEV) {
        console.log('[CREATE_AD] categorySlug:', categorySlug, 'subCategorySlug:', subCategorySlug || 'null');
      }
      
      // Append all images
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });

      await createAd(formData);
      
      success('Ad created successfully');
      navigate('/my-ads');
    } catch (err) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    setValidationErrors((prev) => ({ ...prev, images: null }));
  };

  // Get available subcategories for selected category
  const selectedCategory = categories.find(c => c.slug === categorySlug);
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];
  
  // Dev log
  if (import.meta.env.DEV && categorySlug) {
    console.log('[CATEGORY] selected:', selectedCategory);
  }

  // Reset subcategory when category changes
  const handleCategoryChange = (e) => {
    const newCategorySlug = e.target.value;
    setCategorySlug(newCategorySlug);
    setSubCategorySlug(''); // Reset subcategory
    setValidationErrors((prev) => ({ ...prev, category: null, subCategory: null }));
  };

  const handleSubCategoryChange = (e) => {
    setSubCategorySlug(e.target.value);
    setValidationErrors((prev) => ({ ...prev, subCategory: null }));
  };

  return (
    <div className="page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header mb-6">
          <h1 className="page-header__title">Create New Ad</h1>
          <p className="page-header__subtitle">
            Fill in the details below to create your listing
          </p>
        </div>

        {/* Form Card */}
        <div className="card card--pad">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className={`form-field ${validationErrors.title ? 'form-field--error' : ''}`}>
              <label htmlFor="title" className="form-field__label form-field__label--required">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="input"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, title: null }));
                }}
                disabled={loading}
                placeholder="Enter ad title"
              />
              {validationErrors.title && (
                <div className="form-field__error">{validationErrors.title}</div>
              )}
            </div>

            {/* Description */}
            <div className={`form-field ${validationErrors.description ? 'form-field--error' : ''}`}>
              <label htmlFor="description" className="form-field__label form-field__label--required">
                Description
              </label>
              <textarea
                id="description"
                className="input"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, description: null }));
                }}
                disabled={loading}
                rows={6}
                placeholder="Describe your item in detail (minimum 20 characters)"
              />
              <div className="form-field__hint">
                {description.length} / 20 characters minimum
              </div>
              {validationErrors.description && (
                <div className="form-field__error">{validationErrors.description}</div>
              )}
            </div>

            {/* Category & Subcategory */}
            <div className="form-grid form-grid--2">
              <div className={`form-field ${validationErrors.category ? 'form-field--error' : ''}`}>
                <label htmlFor="category" className="form-field__label form-field__label--required">
                  Category
                </label>
                <select
                  id="category"
                  className="input"
                  value={categorySlug}
                  onChange={handleCategoryChange}
                  disabled={loading || loadingCategories}
                >
                  <option value="">{loadingCategories ? 'Loading categories...' : 'Select Category'}</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name || cat.label}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <div className="form-field__error">{validationErrors.category}</div>
                )}
              </div>

              {categorySlug && (
                <div className={`form-field ${validationErrors.subCategory ? 'form-field--error' : ''}`}>
                  <label htmlFor="subCategory" className="form-field__label">
                    Subcategory
                  </label>
                  <select
                    id="subCategory"
                    className="input"
                    value={subCategorySlug}
                    onChange={handleSubCategoryChange}
                    disabled={loading || loadingCategories || !categorySlug}
                  >
                    <option value="">Select Subcategory (optional)</option>
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
                  {validationErrors.subCategory && (
                    <div className="form-field__error">{validationErrors.subCategory}</div>
                  )}
                </div>
              )}
            </div>

            {/* Price & Currency */}
            <div className="form-grid form-grid--2">
              <div className={`form-field ${validationErrors.price ? 'form-field--error' : ''}`}>
                <label htmlFor="price" className="form-field__label form-field__label--required">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  className="input"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, price: null }));
                  }}
                  disabled={loading}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {validationErrors.price && (
                  <div className="form-field__error">{validationErrors.price}</div>
                )}
              </div>

              <div className={`form-field ${validationErrors.currency ? 'form-field--error' : ''}`}>
                <label htmlFor="currency" className="form-field__label form-field__label--required">
                  Currency
                </label>
                <select
                  id="currency"
                  className="input"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, currency: null }));
                  }}
                  disabled={loading}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="MDL">MDL</option>
                </select>
                {validationErrors.currency && (
                  <div className="form-field__error">{validationErrors.currency}</div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className={`form-field ${validationErrors.images ? 'form-field--error' : ''}`}>
              <label className="form-field__label form-field__label--required">
                Images
              </label>
              <ImageUploader
                value={images}
                onChange={handleImagesChange}
                maxFiles={10}
              />
              <div className="form-field__hint">
                Upload at least 1 image. Maximum 10 images allowed.
              </div>
              {validationErrors.images && (
                <div className="form-field__error">{validationErrors.images}</div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="card card--pad mb-6" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)' }}>
                <div className="text-danger t-small t-bold">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4" style={{ marginTop: 'var(--spacing-xl)' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAd;
