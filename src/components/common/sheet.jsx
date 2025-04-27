import React, { useState } from "react";

export const Sheet = ({ children, open, onOpenChange }) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      )}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-lg z-50 transform ${open ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
        {children}
      </div>
    </>
  );
};

export const SheetTrigger = ({ children, onClick }) => {
  return (
    <div onClick={onClick}>
      {children}
    </div>
  );
};

export const SheetContent = ({ children }) => {
  return (
    <div className="p-6 overflow-y-auto h-full">
      {children}
    </div>
  );
};
