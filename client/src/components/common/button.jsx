import React from "react";
import { cn } from "./utils";

export const Button = ({ children, className, variant = "default", size = "md", ...props }) => {
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors focus:outline-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
