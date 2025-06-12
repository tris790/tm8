import React, { useState } from 'react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description?: string;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  description
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="property-group">
      <div 
        className={`property-group__header ${collapsible ? 'property-group__header--clickable' : ''}`}
        onClick={toggleExpanded}
      >
        <h4 className="property-group__title">{title}</h4>
        {description && (
          <p className="property-group__description">{description}</p>
        )}
        {collapsible && (
          <button
            type="button"
            className="property-group__toggle"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              className={`property-group__toggle-icon ${isExpanded ? 'expanded' : ''}`}
            >
              <path 
                d="M4 6l4 4 4-4" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="property-group__content">
          {children}
        </div>
      )}
    </div>
  );
};