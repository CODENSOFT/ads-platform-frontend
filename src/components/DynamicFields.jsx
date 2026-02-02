import { capitalizeWords } from '../utils/text';

/**
 * Renders dynamic form inputs based on category schema fields.
 * Used in CreateAd and EditAd for category-specific attributes.
 *
 * @param {Object} props
 * @param {Array<{key: string, label?: string, type: string, required?: boolean, options?: Array<string|{value, label}>, min?: number, max?: number, unit?: string}>} props.fields - Schema fields from category
 * @param {Object} props.value - Current attributes { [field.key]: value }
 * @param {function(Object)} props.onChange - (newValue) => void
 * @param {Object} props.errors - Field errors { [field.key]: string }
 * @param {boolean} props.disabled
 * @param {string} props.fieldClassName - Optional wrapper class (e.g. createad-field)
 * @param {string} props.inputClassName - Optional input class (e.g. createad-input)
 */
const DynamicFields = ({
  fields = [],
  value = {},
  onChange,
  errors = {},
  disabled = false,
  fieldClassName = 'createad-field',
  inputClassName = 'createad-input',
}) => {
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const updateOne = (key, val) => {
    const next = { ...value, [key]: val };
    onChange(next);
  };

  const getOptions = (field) => {
    const opts = field.options || [];
    if (!Array.isArray(opts)) return [];
    return opts.map((o) =>
      typeof o === 'string' ? { value: o, label: capitalizeWords(o) } : { value: o.value ?? o.label, label: o.label ?? o.value }
    );
  };

  return (
    <div className="dynamic-fields">
      {fields.map((field) => {
        const key = field.key || field.name;
        if (!key) return null;
        const label = field.label || capitalizeWords(String(key).replace(/-/g, ' '));
        const required = !!field.required;
        const err = errors[key];
        const fieldValue = value[key];
        const isChecked = field.type === 'boolean' && (fieldValue === true || fieldValue === 'true');

        return (
          <div
            key={key}
            className={`${fieldClassName} ${err ? 'createad-field--error' : ''}`}
          >
            {field.type === 'boolean' ? (
              <>
                <label className="dynamic-fields__checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={!!isChecked}
                    onChange={(e) => updateOne(key, e.target.checked)}
                    disabled={disabled}
                    className="dynamic-fields__checkbox"
                    id={`attr-${key}`}
                  />
                  <span className={`createad-field__label ${required ? 'createad-field__label--required' : ''}`}>
                    {label}
                  </span>
                </label>
                {err && <div className="createad-field__error">{err}</div>}
              </>
            ) : (
              <>
                <label htmlFor={`attr-${key}`} className={`createad-field__label ${required ? 'createad-field__label--required' : ''}`}>
                  {label}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={`attr-${key}`}
                    className={inputClassName}
                    value={fieldValue ?? ''}
                    onChange={(e) => updateOne(key, e.target.value || undefined)}
                    disabled={disabled}
                  >
                    <option value="">Select...</option>
                    {getOptions(field).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'number' ? (
                  <div className="dynamic-fields__number-wrap">
                    <input
                      type="number"
                      id={`attr-${key}`}
                      className={inputClassName}
                      value={fieldValue ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === '' ? undefined : Number(v);
                        updateOne(key, v === '' ? undefined : (Number.isFinite(num) ? num : v));
                      }}
                      disabled={disabled}
                      min={field.min}
                      max={field.max}
                      step={field.step ?? 'any'}
                    />
                    {field.unit && (
                      <span className="dynamic-fields__unit">{field.unit}</span>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    id={`attr-${key}`}
                    className={inputClassName}
                    value={fieldValue ?? ''}
                    onChange={(e) => updateOne(key, e.target.value || undefined)}
                    disabled={disabled}
                    placeholder={field.placeholder}
                  />
                )}
                {err && <div className="createad-field__error">{err}</div>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFields;
