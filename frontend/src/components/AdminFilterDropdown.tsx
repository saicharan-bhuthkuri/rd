import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number;
}

interface AdminFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  minWidth?: string;
  maxWidth?: string;
  menuWidth?: string;
  title?: string;
}

export const AdminFilterDropdown: React.FC<AdminFilterDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  minWidth = '130px',
  maxWidth = '190px',
  menuWidth,
  title
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div 
      ref={containerRef} 
      className="admin-custom-dropdown-container"
      style={{ position: 'relative', display: 'inline-block' }}
      title={title}
    >
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="admin-custom-dropdown-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          height: '38px',
          minWidth: minWidth,
          maxWidth: maxWidth,
          padding: '0 0.85rem 0 1rem',
          backgroundColor: '#ffffff',
          border: isOpen ? '1.5px solid #059669' : '1.5px solid var(--border, #e2e8f0)',
          borderRadius: '9999px',
          color: '#1e293b',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen 
            ? '0 0 0 3px rgba(5, 150, 105, 0.15)' 
            : '0 1px 2px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <span 
          style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'left'
          }}
        >
          {displayLabel}
        </span>
        <ChevronDown 
          size={14} 
          style={{
            color: isOpen ? '#059669' : '#64748b',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Floating Menu Card */}
      {isOpen && (
        <div
          className="admin-custom-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: menuWidth || '220px',
            maxWidth: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
            padding: '6px',
            maxHeight: '280px',
            overflowY: 'auto',
            animation: 'dropdownFadeIn 0.15s ease-out'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="admin-custom-dropdown-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#047857' : '#334155',
                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  lineHeight: 1.35
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.color = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
              >
                <span style={{ wordBreak: 'break-word', flex: 1 }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <Check size={14} style={{ color: '#059669', flexShrink: 0, marginLeft: '6px' }} />
                )}
                {opt.badge && !isSelected && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>{opt.badge}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
