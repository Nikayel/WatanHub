import React from 'react';
import { cn } from '../../lib/utils';

export const Button = ({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}) => {
  // Define base styles
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  // Variant styles
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  
  // Size styles
  const sizeStyles = {
    default: "h-10 px-4 py-2 rounded-md",
    sm: "h-8 px-3 rounded-md text-sm",
    lg: "h-12 px-6 rounded-md text-lg",
    icon: "h-10 w-10 rounded-full",
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};