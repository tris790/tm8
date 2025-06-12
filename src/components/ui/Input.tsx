import React from 'react';
import '../../styles/components/input.css';

interface InputProps {
  type?: 'text' | 'search' | 'number' | 'email' | 'password' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  disabled = false,
  required = false,
  className = '',
  id,
}) => {
  const baseClass = 'input';
  const iconClass = icon ? 'input--with-icon' : '';
  const disabledClass = disabled ? 'input--disabled' : '';
  
  const classes = [baseClass, iconClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="input-container">
      {icon && <div className="input-icon">{icon}</div>}
      <input
        type={type}
        className={classes}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        id={id}
      />
    </div>
  );
};