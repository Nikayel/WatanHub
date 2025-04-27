import React, { useEffect } from "react";
import { createPortal } from "react-dom"; // ✅ Needed for portal

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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Slide-in Drawer */}
        <div 
          className="fixed inset-y-0 right-0 w-4/5 sm:w-80 bg-white dark:bg-gray-900 shadow-xl overflow-auto"
          style={{
            animation: "slideIn 0.3s ease-out forwards",
            zIndex: 10000
          }}
        >
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
    document.body // ✅ Mount under <body> directly
  );
};

Sheet.displayName = "Sheet";
SheetTrigger.displayName = "SheetTrigger";
SheetContent.displayName = "SheetContent";
