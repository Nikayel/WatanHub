// src/components/ui/dialog.js
import React from 'react';

export const Dialog = ({ children }) => {
  return <div className="dialog">{children}</div>;
};

export const DialogTrigger = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

// Add this new export:
export const DialogContent = ({ children }) => {
  return <div className="dialog-content">{children}</div>;
};
