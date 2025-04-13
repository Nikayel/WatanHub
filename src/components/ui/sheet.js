import React from 'react';

export const Sheet = ({ children }) => <div className="sheet">{children}</div>;

export const SheetContent = ({ children }) => (
  <div className="sheet-content">{children}</div>
);

export const SheetTrigger = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);
