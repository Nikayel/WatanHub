import React, { useEffect } from "react";

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
  // Lock body scroll when sheet is open
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
  
  return (
    <>
      {/* Super high z-index to ensure it's above everything */}
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Slide-in panel */}
        <div 
          className="fixed inset-y-0 right-0 w-4/5 sm:w-80 bg-white dark:bg-gray-900 shadow-xl overflow-auto"
          style={{animation: "slideIn 0.3s ease-out forwards"}}
        >
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 flex justify-end p-4">
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the keyframe animation */}
      <style jsx="true">{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

SheetTrigger.displayName = "SheetTrigger";
SheetContent.displayName = "SheetContent";