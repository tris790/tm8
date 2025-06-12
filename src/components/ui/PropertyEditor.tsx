import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { usePropertyValidation, ValidationResult } from '../../hooks/usePropertyValidation';

interface PropertyEditorProps {
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'url' | 'email';
  value: any;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string }> | string[];
  required?: boolean;
  validation?: Array<(value: any) => ValidationResult>;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  id?: string;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  label, 
  type, 
  value, 
  onChange, 
  options = [], 
  required = false,
  validation = [],
  placeholder,
  disabled = false,
  description,
  id
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const { validateValue, validateRequired } = usePropertyValidation();

  // Validate value whenever it changes or when touched
  useEffect(() => {
    if (!isTouched) return;

    const rules = [...validation];
    if (required) {
      rules.unshift(validateRequired);
    }

    const result = validateValue(value, rules);
    setError(result.isValid ? null : result.error || 'Invalid value');
  }, [value, validation, required, validateValue, validateRequired, isTouched]);

  const handleChange = (newValue: any) => {
    setIsTouched(true);
    onChange(newValue);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const renderInput = () => {
    switch (type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <Input
            type={type}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder || label}
            required={required}
            disabled={disabled}
            className={error ? 'input--error' : ''}
            id={id}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(val) => handleChange(val === '' ? null : Number(val))}
            placeholder={placeholder || '0'}
            required={required}
            disabled={disabled}
            className={error ? 'input--error' : ''}
            id={id}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onChange={handleChange}
            options={options}
            placeholder={placeholder || `Select ${label.toLowerCase()}`}
            disabled={disabled}
            className={error ? 'select--error' : ''}
            id={id}
          />
        );

      case 'boolean':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">{value ? 'Yes' : 'No'}</span>
          </label>
        );

      case 'color':
        return (
          <div className="color-input-container">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="color-input"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={handleChange}
              placeholder="#000000"
              disabled={disabled}
              className={error ? 'input--error' : ''}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="property-editor">
      <div className="property-editor__header">
        <label className="property-editor__label">
          {label}
          {required && <span className="property-editor__required">*</span>}
        </label>
        {description && (
          <span className="property-editor__description">{description}</span>
        )}
      </div>
      
      <div className="property-editor__input" onBlur={handleBlur}>
        {renderInput()}
      </div>
      
      {error && (
        <span className="property-editor__error">{error}</span>
      )}
    </div>
  );
};