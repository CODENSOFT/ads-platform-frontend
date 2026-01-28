import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdById, updateAd, updateAdFormData } from '../api/endpoints';
import useCategories from '../hooks/useCategories';
import ImageUploader from '../components/ImageUploader';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const EditAd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ad, setAd] = useState(null);

  const { categories, loading: loadingCategories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [categorySlug, setCategorySlug] = useState('');
  const [subCategorySlug, setSubCategorySlug] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const adId = useMemo(() => (ad?._id || ad?.id || id || '').trim(), [ad, id]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdById(id);
        const adData = res.data?.ad || res.data?.data || res.data;
        setAd(adData);

        setTitle(adData?.title || '');
        setDescription(adData?.description || '');
        setPrice(adData?.price != null ? String(adData.price) : '');
        setCurrency(adData?.currency || 'EUR');

        const catSlug =
          adData?.category?.slug ||
          adData?.categorySlug ||
          (typeof adData?.category === 'string' ? adData.category : '') ||
          '';
        const subSlug =
          adData?.subCategory?.slug ||
          adData?.subCategorySlug ||
          (typeof adData?.subCategory === 'string' ? adData.subCategory : '') ||
          '';
        setCategorySlug(catSlug);
        setSubCategorySlug(subSlug);
      } catch (err) {
        const message = err?.response?.data?.message || err.message || 'Failed to load ad';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAd();
  }, [id]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  );
  const availableSubcategories = selectedCategory?.subcategories || selectedCategory?.subs || [];

  const validate = () => {
    const errors = {};
    const t = title.trim();
    const d = description.trim();
    const p = Number(price);

    if (!t) errors.title = 'Title is required';
    else if (t.length < 3) errors.title = 'Title must be at least 3 characters';

    if (!d) errors.description = 'Description is required';
    else if (d.length < 20) errors.description = 'Description must be at least 20 characters';

    if (!price || !Number.isFinite(p) || p <= 0) errors.price = 'Price must be a number greater than 0';

    const validCurrencies = ['EUR', 'USD', 'MDL'];
    if (!currency || !validCurrencies.includes(currency)) errors.currency = 'Currency must be EUR, USD, or MDL';

    if (!categorySlug || !categorySlug.trim()) errors.category = 'Category is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategoryChange = (e) => {
    const newSlug = e.target.value;
    setCategorySlug(newSlug);
    setSubCategorySlug('');
    setValidationErrors((prev) => ({ ...prev, category: null, subCategory: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!adId) {
      showError('Missing ad id.');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        currency,
        categorySlug: categorySlug.trim(),
      };
      if (subCategorySlug && subCategorySlug.trim()) payload.subCategorySlug = subCategorySlug.trim();

      // If user attached new images, attempt multipart PATCH (if backend supports it)
      if (newImages.length > 0) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
        Array.from(newImages).forEach((file) => formData.append('images', file));
        await updateAdFormData(adId, formData);
      } else {
        await updateAd(adId, payload);
      }

      success('Ad updated');
      navigate('/my-ads');
    } catch (err) {
      const msg = parseError(err);
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <div className="t-muted">Loading ad…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ad) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--pad text-center py-6">
            <div className="t-h3 mb-2">Could not load ad</div>
            <div className="t-muted mb-6">{error}</div>
            <button className="btn btn-secondary" onClick={() => navigate('/my-ads')}>
              Back to My Ads
            </button>
          </div>
        </div>
      </div>
    );
  }

  const existingImages = Array.isArray(ad?.images) ? ad.images : [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header mb-6">
          <h1 className="page-header__title">Edit Ad</h1>
          <p className="page-header__subtitle">Update details and publish changes</p>
        </div>

        <div className="card card--pad">
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid--2">
              <div className={`form-field ${validationErrors.title ? 'form-field--error' : ''}`}>
                <label className="form-field__label form-field__label--required" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  className="input"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, title: null }));
                  }}
                  disabled={saving}
                />
                {validationErrors.title && <div className="form-field__error">{validationErrors.title}</div>}
              </div>

              <div className="form-grid form-grid--2" style={{ gap: 'var(--spacing-lg)' }}>
                <div className={`form-field ${validationErrors.price ? 'form-field--error' : ''}`}>
                  <label className="form-field__label form-field__label--required" htmlFor="price">
                    Price
                  </label>
                  <input
                    id="price"
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, price: null }));
                    }}
                    disabled={saving}
                  />
                  {validationErrors.price && <div className="form-field__error">{validationErrors.price}</div>}
                </div>

                <div className={`form-field ${validationErrors.currency ? 'form-field--error' : ''}`}>
                  <label className="form-field__label form-field__label--required" htmlFor="currency">
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
                    disabled={saving}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="MDL">MDL</option>
                  </select>
                  {validationErrors.currency && <div className="form-field__error">{validationErrors.currency}</div>}
                </div>
              </div>
            </div>

            <div className={`form-field ${validationErrors.description ? 'form-field--error' : ''}`}>
              <label className="form-field__label form-field__label--required" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="input"
                rows={7}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, description: null }));
                }}
                disabled={saving}
              />
              <div className="form-field__hint">{description.length} / 20 characters minimum</div>
              {validationErrors.description && (
                <div className="form-field__error">{validationErrors.description}</div>
              )}
            </div>

            <div className="form-grid form-grid--2">
              <div className={`form-field ${validationErrors.category ? 'form-field--error' : ''}`}>
                <label className="form-field__label form-field__label--required" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="input"
                  value={categorySlug}
                  onChange={handleCategoryChange}
                  disabled={saving || loadingCategories}
                >
                  <option value="">{loadingCategories ? 'Loading categories…' : 'Select Category'}</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name || cat.label}
                    </option>
                  ))}
                </select>
                {validationErrors.category && <div className="form-field__error">{validationErrors.category}</div>}
              </div>

              <div className={`form-field ${validationErrors.subCategory ? 'form-field--error' : ''}`}>
                <label className="form-field__label" htmlFor="subCategory">
                  Subcategory
                </label>
                <select
                  id="subCategory"
                  className="input"
                  value={subCategorySlug}
                  onChange={(e) => {
                    setSubCategorySlug(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, subCategory: null }));
                  }}
                  disabled={saving || loadingCategories || !categorySlug}
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
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="form-field">
                <div className="form-field__label">Current images</div>
                <div className="grid grid-4" style={{ gap: '12px' }}>
                  {existingImages.slice(0, 8).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="card overflow-hidden" style={{ padding: 0 }}>
                      <img
                        src={src}
                        alt=""
                        style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-field__hint">
                  To replace images, upload new ones below (if supported by the backend).
                </div>
              </div>
            )}

            {/* New images */}
            <div className={`form-field ${validationErrors.images ? 'form-field--error' : ''}`}>
              <label className="form-field__label">Upload new images (optional)</label>
              <ImageUploader value={newImages} onChange={setNewImages} maxFiles={10} />
              {validationErrors.images && <div className="form-field__error">{validationErrors.images}</div>}
            </div>

            {error && (
              <div
                className="card card--pad mb-6"
                style={{ background: 'var(--danger-soft)', borderColor: 'rgba(239, 68, 68, 0.28)' }}
              >
                <div className="text-danger t-small t-bold">{error}</div>
              </div>
            )}

            <div className="flex gap-4" style={{ marginTop: 'var(--spacing-xl)' }}>
              <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAd;

