import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ 
  className, 
  type, 
  error,
  success,
  disabled,
  icon,
  iconPosition = 'left',
  label,
  helperText,
  ...props 
}, ref) => {
  const inputClasses = cn(
    "flex h-10 w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm ring-offset-bg-card file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
    error && "border-error focus-visible:ring-error",
    success && "border-success focus-visible:ring-success",
    icon && "pl-10",
    className
  );

  const containerClasses = cn(
    "relative",
    disabled && "opacity-50"
  );

  const labelClasses = cn(
    "block text-sm font-medium mb-2 text-text-primary",
    error && "text-error",
    success && "text-success"
  );

  const helperClasses = cn(
    "mt-2 text-xs",
    error ? "text-error" : success ? "text-success" : "text-text-muted"
  );

  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      
      <div className={containerClasses}>
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-text-muted">
              {icon}
            </span>
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-text-muted">
              {icon}
            </span>
          </div>
        )}
      </div>
      
      {helperText && (
        <p className={helperClasses}>
          {helperText}
        </p>
      )}
      
      {error && typeof error === 'string' && (
        <p className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };