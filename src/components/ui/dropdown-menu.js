import React from 'react';

export const DropdownMenu = ({ children }) => (
  <div className="dropdown-menu">{children}</div>
);

export const DropdownMenuContent = ({ children }) => (
  <div className="dropdown-menu-content">{children}</div>
);

export const DropdownMenuItem = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const DropdownMenuSeparator = () => <hr />;

export const DropdownMenuTrigger = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);
