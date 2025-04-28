import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export const Sheet = ({ open, onOpenChange, children }) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        if (child.type.displayName === "SheetContent") {
          return React.cloneElement(child, { open, onOpenChange });
        }
        
        if (child.type.displayName === "SheetTrigger") {
          return React.cloneElement(child, { onOpenChange });
        }
        
        return child;
      })}
    </div>
  );
};

export const SheetTrigger = ({ children, onOpenChange }) => (
  <div 
    onClick={() => onOpenChange(true)}
    className="focus:outline-none cursor-pointer"
  >
    {children}
  </div>
);

export const SheetContent = ({ children, open, onOpenChange }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Slide-in Drawer */}
        <div 
          className="fixed inset-y-0 right-0 w-4/5 max-w-[320px] bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-2xl rounded-l-2xl overflow-y-auto p-6"
          style={{
            animation: "slideIn 0.3s ease-out forwards",
            zIndex: 10000
          }}
        >
          {/* YOUR mobile content injected here */}
          {children}
        </div>
      </div>

      <style jsx="true">{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>,
    document.body
  );
};

Sheet.displayName = "Sheet";
SheetTrigger.displayName = "SheetTrigger";
SheetContent.displayName = "SheetContent";
