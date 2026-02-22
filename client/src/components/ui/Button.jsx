import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm hover:shadow-md focus:ring-primary",
    secondary: "bg-secondary hover:bg-secondary-hover text-secondary-foreground shadow-sm hover:shadow-md focus:ring-secondary",
    accent: "bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm hover:shadow-md focus:ring-accent",
    success: "bg-success hover:bg-success-hover text-success-foreground shadow-sm hover:shadow-md focus:ring-success",
    outline: "border border-border bg-transparent hover:bg-bg-muted text-text-primary shadow-sm hover:shadow focus:ring-primary",
    ghost: "hover:bg-bg-muted text-text-primary focus:ring-primary",
    link: "text-primary hover:text-primary-hover underline-offset-4 hover:underline"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };
  
  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );
  
  const whileTap = disabled ? {} : { scale: 0.98 };
  const whileHover = disabled ? {} : { y: -2 };
  
  return (
    <motion.button
      ref={ref}
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button };