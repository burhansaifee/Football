import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ 
  children, 
  className, 
  hover = true,
  animate = true,
  ...props 
}, ref) => {
  const classes = cn(
    "bg-bg-card border border-border rounded-lg shadow-sm overflow-hidden",
    hover && "hover:shadow-md hover:border-border-muted transition-all duration-300",
    className
  );
  
  const whileHover = hover ? { y: -2 } : {};
  
  return (
    <motion.div
      ref={ref}
      className={classes}
      whileHover={whileHover}
      initial={animate ? { opacity: 0, y: 20 } : {}}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight text-text-primary", className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };