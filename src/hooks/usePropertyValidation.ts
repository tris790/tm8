import { useMemo } from 'react';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const usePropertyValidation = () => {
  const validators = useMemo(() => ({
    validateURL: (value: string): ValidationResult => {
      if (!value) return { isValid: true };
      try {
        new URL(value);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Invalid URL format' };
      }
    },

    validateRequired: (value: any): ValidationResult => {
      const isValid = value !== null && value !== undefined && value !== '';
      return {
        isValid,
        error: isValid ? undefined : 'This field is required'
      };
    },

    validateEmail: (value: string): ValidationResult => {
      if (!value) return { isValid: true };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);
      return {
        isValid,
        error: isValid ? undefined : 'Invalid email format'
      };
    },

    validateNumber: (value: any): ValidationResult => {
      if (value === '' || value === null || value === undefined) return { isValid: true };
      const isValid = !isNaN(Number(value)) && isFinite(Number(value));
      return {
        isValid,
        error: isValid ? undefined : 'Must be a valid number'
      };
    },

    validateMinLength: (minLength: number) => (value: string): ValidationResult => {
      if (!value) return { isValid: true };
      const isValid = value.length >= minLength;
      return {
        isValid,
        error: isValid ? undefined : `Must be at least ${minLength} characters`
      };
    },

    validateMaxLength: (maxLength: number) => (value: string): ValidationResult => {
      if (!value) return { isValid: true };
      const isValid = value.length <= maxLength;
      return {
        isValid,
        error: isValid ? undefined : `Must be no more than ${maxLength} characters`
      };
    },

    validatePattern: (pattern: RegExp, errorMessage: string) => (value: string): ValidationResult => {
      if (!value) return { isValid: true };
      const isValid = pattern.test(value);
      return {
        isValid,
        error: isValid ? undefined : errorMessage
      };
    }
  }), []);

  const validateValue = (value: any, rules: Array<(val: any) => ValidationResult>): ValidationResult => {
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };

  return {
    ...validators,
    validateValue
  };
};