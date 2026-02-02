import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAd, getCategoryBySlug } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import useCategories from '../hooks/useCategories';
import ImageUploader from '../components/ImageUploader';
import DynamicFields from '../components/DynamicFields';
import { capitalizeWords } from '../utils/text';
import { validateDynamicDetails, mergeFieldsByKey } from '../utils/dynamicDetailsValidation';
import { CATEGORY_SLUG_ALIASES, CATEGORY_FIELD_PRESETS } from '../config/categoryFieldPresets';
import { getBaseFieldsByCategorySlug, getExtraFieldsBySubcategorySlug } from '../catalog/categoryFieldCatalog';
import { getFallbackFieldsForCategory } from '../constants/categoryFieldSchemas';
import '../styles/create-ad.css';

const canonicalSlug = (slug) => {
  const s = String(slug || '').toLowerCase().trim();
  return CATEGORY_SLUG_ALIASES[s] || s;
};

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
  const [previewUrl, setPreviewUrl] = useState('');
  const { success, error: showError } = useToast();

  const { categories, loading: loadingCategories, error: categoriesError } = useCategories();
  const [categorySlug, setCategorySlug] = useState('');
  const [subCategorySlug, setSubCategorySlug] = useState('');
  const [details, setDetails] = useState({});
  const [categoryWithFields, setCategoryWithFields] = useState(null);
  const [categoryFieldsLoading, setCategoryFieldsLoading] = useState(false);
  const [invalidKeysFromBackend, setInvalidKeysFromBackend] = useState([]);

  useEffect(() => {
    const url = images?.[0] ? URL.createObjectURL(images[0]) : '';
    setPreviewUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [images]);

  // When category changes: reset details and load category schema (with fields)
  useEffect(() => {
    setDetails({});
    setCategoryWithFields(null);
    setCategoryFieldsLoading(false);
    if (!categorySlug || !categorySlug.trim()) return;

    const fromList = categories.find((c) => c.slug === categorySlug);
    let cancelled = false;
    setCategoryFieldsLoading(true);
    getCategoryBySlug(categorySlug)
      .then((res) => {
        if (cancelled) return;
        const cat = res?.data?.category ?? res?.data?.data ?? res?.data;
        if (cat && (cat.fields == null || Array.isArray(cat.fields))) {
          setCategoryWithFields(cat);
          if (import.meta.env.DEV && (!cat.fields || cat.fields.length === 0)) {
            console.warn('[CATEGORY] fields missing for', categorySlug);
          }
        } else {
          setCategoryWithFields(fromList || cat || null);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoryWithFields(fromList || null);
      })
      .finally(() => {
        if (!cancelled) setCategoryFieldsLoading(false);
      });
    return () => { cancelled = true; };
  }, [categorySlug, categories]);

  const canonicalCategorySlug = canonicalSlug(categorySlug);
  const selectedCategory = categoryWithFields || categories.find((c) => c.slug === categorySlug);
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];
  const selectedSub = subCategorySlug
    ? availableSubcategories.find((s) => (s.slug || s) === subCategorySlug)
    : null;

  const apiBase = Array.isArray(selectedCategory?.fields) ? selectedCategory.fields : [];
  const selectedSubFields = Array.isArray(selectedSub?.fields) ? selectedSub.fields : [];
  const allSubFieldsUnion = (availableSubcategories || []).reduce(
    (acc, s) => mergeFieldsByKey(acc, s.fields || []),
    []
  );
  const mergedFields =
    apiBase.length > 0
      ? mergeFieldsByKey(apiBase, selectedSubFields)
      : selectedSub
        ? mergeFieldsByKey([], selectedSubFields)
        : allSubFieldsUnion;
  const fallbackFromConstants = getFallbackFieldsForCategory(categorySlug);
  const fallbackBase = getBaseFieldsByCategorySlug(categorySlug);
  const fallbackSubExtra = getExtraFieldsBySubcategorySlug(categorySlug, subCategorySlug);
  const baseFieldsFallback =
    fallbackFromConstants.length > 0
      ? fallbackFromConstants
      : (fallbackBase.length > 0 ? fallbackBase : (CATEGORY_FIELD_PRESETS[canonicalCategorySlug] || []));
  const subExtraFields = selectedSubFields.length > 0 ? selectedSubFields : fallbackSubExtra;
  const finalFields =
    mergedFields.length > 0 ? mergedFields : mergeFieldsByKey(baseFieldsFallback, subExtraFields);

  // When subcategory/category changes: keep details but remove keys no longer in finalFields
  useEffect(() => {
    if (!categorySlug) return;
    const sel = categoryWithFields || categories.find((c) => c.slug === categorySlug);
    const apiBaseEff = Array.isArray(sel?.fields) ? sel.fields : [];
    const subs = sel?.subcategories || sel?.subs || [];
    const sub = subCategorySlug ? subs.find((s) => (s.slug || s) === subCategorySlug) : null;
    const selectedSubFieldsEff = Array.isArray(sub?.fields) ? sub.fields : [];
    const allSubUnionEff = (subs || []).reduce((acc, s) => mergeFieldsByKey(acc, s.fields || []), []);
    const mergedEff =
      apiBaseEff.length > 0
        ? mergeFieldsByKey(apiBaseEff, selectedSubFieldsEff)
        : sub
          ? mergeFieldsByKey([], selectedSubFieldsEff)
          : allSubUnionEff;
    const fallbackConstEff = getFallbackFieldsForCategory(categorySlug);
    const fallbackBaseEff = getBaseFieldsByCategorySlug(categorySlug);
    const fallbackSubEff = getExtraFieldsBySubcategorySlug(categorySlug, subCategorySlug);
    const baseFallbackEff =
      fallbackConstEff.length > 0
        ? fallbackConstEff
        : (fallbackBaseEff.length > 0 ? fallbackBaseEff : (CATEGORY_FIELD_PRESETS[canonicalSlug(categorySlug)] || []));
    const subEff = selectedSubFieldsEff.length > 0 ? selectedSubFieldsEff : fallbackSubEff;
    const final = mergedEff.length > 0 ? mergedEff : mergeFieldsByKey(baseFallbackEff, subEff);
    if (final.length === 0) {
      setDetails({});
      return;
    }
    const keys = new Set(final.map((f) => f.key || f.name).filter(Boolean));
    setDetails((prev) => {
      const next = {};
      keys.forEach((k) => {
        if (prev[k] !== undefined) next[k] = prev[k];
      });
      if (
        Object.keys(next).length === Object.keys(prev).length &&
        Object.keys(prev).every((k) => keys.has(k))
      ) {
        return prev;
      }
      return next;
    });
  }, [categorySlug, subCategorySlug, categoryWithFields, categories]);

  const validate = () => {
    const errors = {};

    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      errors.title = 'Title is required';
    } else if (titleTrimmed.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!description || !description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    const priceNum = Number(price);
    if (!price || !isFinite(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!currency || !validCurrencies.includes(currency)) {
      errors.currency = 'Currency must be EUR, USD, or MDL';
    }

    if (images.length === 0) {
      errors.images = 'At least one image is required';
    }

    if (!categorySlug || !categorySlug.trim()) {
      errors.category = 'Category is required';
    }

    const detailErrors = validateDynamicDetails(finalFields, details);
    Object.assign(errors, detailErrors);

    // Educație & Cursuri: city required when format is Offline or Hibrid
    const slugForEducatie = String(categorySlug || '').toLowerCase().replace(/\s+/g, '-');
    const isEducatieCursuri = slugForEducatie === 'educatie-cursuri' || slugForEducatie === 'educatie-si-cursuri';
    if (isEducatieCursuri && (details.format === 'Offline' || details.format === 'Hibrid') && !String(details.city || '').trim()) {
      errors.detail_city = 'Orașul este obligatoriu pentru format Offline sau Hibrid';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setInvalidKeysFromBackend([]);

    if (!validate()) {
      return;
    }

    if (!categorySlug || !categorySlug.trim()) {
      showError('Please select a category.');
      setValidationErrors((prev) => ({ ...prev, category: 'Category is required' }));
      return;
    }

    const selectedCategory = categories.find((c) => c.slug === categorySlug);
    if (!selectedCategory) {
      showError('Invalid category selected. Please select a valid category.');
      setValidationErrors((prev) => ({ ...prev, category: 'Invalid category' }));
      return;
    }

    if (subCategorySlug && subCategorySlug.trim()) {
      const subcategories = selectedCategory.subcategories || selectedCategory.subs || [];
      const isValidSub = subcategories.some((sub) => {
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
      const allowedDetailKeys = new Set((finalFields || []).map((f) => f.key || f.name).filter(Boolean));
      const sanitizedDetails = Object.fromEntries(
        Object.entries(details || {}).filter(([k]) => allowedDetailKeys.has(k))
      );

      const isEmptyDetails = !sanitizedDetails || Object.keys(sanitizedDetails).length === 0;

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', String(Number(price)));
      formData.append('currency', currency);
      formData.append('categorySlug', categorySlug);

      if (subCategorySlug && subCategorySlug.trim()) {
        formData.append('subCategorySlug', subCategorySlug.trim());
      }

      if (!isEmptyDetails) {
        formData.append('details', JSON.stringify(sanitizedDetails));
      }

      Array.from(images).forEach((file) => formData.append('images', file));

      if (import.meta.env.DEV) {
        console.log('[CREATE_AD] formData keys:', Array.from(formData.keys()));
        console.log('[CREATE_AD] details keys:', Object.keys(sanitizedDetails));
      }

      await createAd(formData);
      success('Ad created successfully');
      navigate('/my-ads');
    } catch (err) {
      const data = err?.response?.data;
      if (import.meta.env.DEV) console.log('[CREATE_AD] error data:', data);

      const msg = data?.message || parseError(err);
      setError(msg);
      showError(msg);

      if (data?.invalidKeys && Array.isArray(data.invalidKeys) && data.invalidKeys.length > 0) {
        setInvalidKeysFromBackend(data.invalidKeys);
        showError(`Invalid fields: ${data.invalidKeys.join(', ')}`);
      } else {
        setInvalidKeysFromBackend([]);
      }

      if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
        setValidationErrors((prev) => ({ ...prev, ...data.fieldErrors }));
        const firstErrorKey = Object.keys(data.fieldErrors)[0];
        if (firstErrorKey) {
          setTimeout(() => {
            const id = firstErrorKey.startsWith('detail_') ? `attr-${firstErrorKey.slice(7)}` : firstErrorKey;
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    setValidationErrors((prev) => ({ ...prev, images: null }));
  };

  const handleCategoryChange = (e) => {
    const newCategorySlug = e.target.value;
    setCategorySlug(newCategorySlug);
    setSubCategorySlug('');
    setDetails({});
    setInvalidKeysFromBackend([]);
    setValidationErrors((prev) => {
      const next = { ...prev, category: null, subCategory: null };
      Object.keys(next).forEach((k) => { if (k.startsWith('detail_')) delete next[k]; });
      return next;
    });
  };

  const handleSubCategoryChange = (e) => {
    setSubCategorySlug(e.target.value);
    setValidationErrors((prev) => ({ ...prev, subCategory: null }));
  };

  const step1Active = title.trim().length >= 3 && description.trim().length >= 20 && price && Number(price) > 0;
  const step2Active = !!categorySlug?.trim();
  const step3Active = images.length > 0;

  return (
    <div className="createad-page">
      <div className="createad-shell">
        <header className="createad-header">
          <div>
            <h1 className="createad-title">Create New Ad</h1>
            <p className="createad-sub">
              Publish a premium listing with clear details and great photos.
            </p>
          </div>
          <div className="createad-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            <button
              type="submit"
              form="create-ad-form"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create Ad'}
            </button>
          </div>
        </header>

        <div className="createad-grid">
          <aside className="createad-preview">
            <div className="card createad-preview-card">
              <h2 className="createad-preview-title">Live Preview</h2>
              <div className="createad-preview-label">Title</div>
              <div className={`createad-preview-value ${!title.trim() ? 'createad-preview-value--muted' : ''}`}>
                {title.trim() || 'Your ad title…'}
              </div>
              <div className="createad-preview-label">Price</div>
              <div className="createad-preview-value">
                {price && Number(price) > 0 ? `${price} ${currency}` : '--'}
              </div>
              <div className="createad-preview-label">Category</div>
              <div className="createad-preview-value">
                {selectedCategory?.name || selectedCategory?.label || '--'}
              </div>
              <div className="createad-preview-label">Photo</div>
              <div className="createad-preview-thumb">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" />
                ) : (
                  <span className="createad-preview-thumb-placeholder">No image yet</span>
                )}
              </div>
            </div>
            <div className="card createad-tips">
              <h3 className="createad-tips-title">Tips</h3>
              <ul className="createad-tips-list">
                <li>Use a clear, descriptive title</li>
                <li>Add at least one high-quality photo</li>
                <li>Describe condition and details accurately</li>
                <li>Set a fair price for faster sales</li>
              </ul>
            </div>
          </aside>

          <main className="createad-form card">
            <div className="createad-stepper">
              <div className={`createad-stepper-step ${step1Active ? 'is-active' : ''}`}>
                <span className="createad-stepper-step-num">1</span>
                Details
              </div>
              <span className="createad-stepper-sep" />
              <div className={`createad-stepper-step ${step2Active ? 'is-active' : ''}`}>
                <span className="createad-stepper-step-num">2</span>
                Category
              </div>
              <span className="createad-stepper-sep" />
              <div className={`createad-stepper-step ${step3Active ? 'is-active' : ''}`}>
                <span className="createad-stepper-step-num">3</span>
                Photos & Publish
              </div>
            </div>

            <form id="create-ad-form" onSubmit={handleSubmit}>
              {error && (
                <div className="createad-alert createad-alert--error" role="alert">
                  {error}
                </div>
              )}

              {categoriesError && (
                <div className="createad-alert createad-alert--warn">
                  {categoriesError}
                </div>
              )}

              <section className="createad-section">
                <h3 className="createad-section-title">Listing details</h3>
                <p className="createad-section-sub">Title and description for your listing</p>

                <div className={`createad-field ${validationErrors.title ? 'createad-field--error' : ''}`}>
                  <label htmlFor="title" className="createad-field__label createad-field__label--required">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="createad-input"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, title: null }));
                    }}
                    disabled={loading}
                    placeholder="Enter ad title"
                  />
                  {validationErrors.title && (
                    <div className="createad-field__error">{validationErrors.title}</div>
                  )}
                </div>

                <div className={`createad-field ${validationErrors.description ? 'createad-field--error' : ''}`}>
                  <label htmlFor="description" className="createad-field__label createad-field__label--required">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="createad-input"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, description: null }));
                    }}
                    disabled={loading}
                    rows={6}
                    placeholder="Describe your item in detail (minimum 20 characters)"
                  />
                  <div className={`createad-field__hint ${description.length >= 20 ? 'createad-field__hint--ok' : ''}`}>
                    {description.length} / 20 minimum
                  </div>
                  {validationErrors.description && (
                    <div className="createad-field__error">{validationErrors.description}</div>
                  )}
                </div>
              </section>

              <section className="createad-section">
                <h3 className="createad-section-title">Category</h3>
                <p className="createad-section-sub">Choose a category and optional subcategory</p>

                <div className={`createad-field ${validationErrors.category ? 'createad-field--error' : ''}`}>
                  <label htmlFor="category" className="createad-field__label createad-field__label--required">
                    Category
                  </label>
                  <select
                    id="category"
                    className="createad-input"
                    value={categorySlug}
                    onChange={handleCategoryChange}
                    disabled={loading || loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? 'Loading categories…' : 'Select Category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {capitalizeWords(cat.name || cat.label)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <div className="createad-field__error">{validationErrors.category}</div>
                  )}
                </div>

                {categorySlug && (
                  <div className={`createad-field ${validationErrors.subCategory ? 'createad-field--error' : ''}`}>
                    <label htmlFor="subCategory" className="createad-field__label">
                      Subcategory
                    </label>
                    <select
                      id="subCategory"
                      className="createad-input"
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
                            {capitalizeWords(subLabel)}
                          </option>
                        );
                      })}
                    </select>
                    {validationErrors.subCategory && (
                      <div className="createad-field__error">{validationErrors.subCategory}</div>
                    )}
                  </div>
                )}
              </section>

              {categorySlug && (
                <section className="createad-section createad-section--details">
                  <h3 className="createad-section-title">Details</h3>
                  <p className="createad-section-sub">
                    {finalFields.length > 0 ? 'Complete details to improve visibility.' : 'Category-specific criteria for your listing'}
                  </p>
                  {categoryFieldsLoading ? (
                    <div className="createad-details-skeleton" aria-hidden="true">
                      <div className="createad-skeleton-line" />
                      <div className="createad-skeleton-line" />
                      <div className="createad-skeleton-line createad-skeleton-line--short" />
                    </div>
                  ) : finalFields.length > 0 ? (
                    <div className="createad-details-grid">
                      <DynamicFields
                        fields={finalFields}
                        value={details}
                        onChange={setDetails}
                        errors={Object.fromEntries(
                          finalFields
                            .filter((f) => (f.key || f.name) && validationErrors[`detail_${f.key || f.name}`])
                            .map((f) => [(f.key || f.name), validationErrors[`detail_${f.key || f.name}`]])
                        )}
                        disabled={loading}
                      />
                    </div>
                  ) : (
                    <div className="createad-empty-details">
                      No criteria for this category yet. Please contact support.
                    </div>
                  )}
                  {invalidKeysFromBackend.length > 0 && (
                    <div className="createad-details-invalid-keys" role="alert">
                      Invalid criteria: {invalidKeysFromBackend.join(', ')}
                    </div>
                  )}
                </section>
              )}

              <section className="createad-section">
                <h3 className="createad-section-title">Pricing</h3>
                <p className="createad-section-sub">Set price and currency</p>

                <div className="createad-grid-2">
                  <div className={`createad-field ${validationErrors.price ? 'createad-field--error' : ''}`}>
                    <label htmlFor="price" className="createad-field__label createad-field__label--required">
                      Price
                    </label>
                    <input
                      type="number"
                      id="price"
                      className="createad-input"
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
                      <div className="createad-field__error">{validationErrors.price}</div>
                    )}
                  </div>
                  <div className={`createad-field ${validationErrors.currency ? 'createad-field--error' : ''}`}>
                    <label htmlFor="currency" className="createad-field__label createad-field__label--required">
                      Currency
                    </label>
                    <select
                      id="currency"
                      className="createad-input"
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
                      <div className="createad-field__error">{validationErrors.currency}</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="createad-section">
                <h3 className="createad-section-title">Photos</h3>
                <p className="createad-section-sub">At least one image required. Max 10 images.</p>

                <div className={`createad-field ${validationErrors.images ? 'createad-field--error' : ''}`}>
                  <label className="createad-field__label createad-field__label--required">
                    Images
                  </label>
                  <ImageUploader value={images} onChange={handleImagesChange} maxFiles={10} />
                  <div className="createad-field__hint">
                    Upload at least 1 image. Maximum 10 images allowed.
                  </div>
                  {validationErrors.images && (
                    <div className="createad-field__error">{validationErrors.images}</div>
                  )}
                </div>
              </section>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreateAd;
