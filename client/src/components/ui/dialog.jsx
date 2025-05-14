import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

// The root Dialog component
const Dialog = DialogPrimitive.Root;

// Trigger for opening the dialog
const DialogTrigger = DialogPrimitive.Trigger;

// DialogPortal component
const DialogPortal = ({ children }) => (
  <DialogPrimitive.Portal>
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
      {children}
    </div>
  </DialogPrimitive.Portal>
);

// DialogOverlay component
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));

// DialogContent with overlay and centered animation
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full gap-4 rounded-b-lg border bg-background p-6 shadow-lg animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

// A simple header container for the dialog
const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn("mb-4", className)} {...props}>
    {children}
  </div>
);
DialogHeader.displayName = "DialogHeader";

// DialogTitle using Radix's Title primitive with custom styles
const DialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-bold", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Title>
));
DialogTitle.displayName = "DialogTitle";

// DialogDescription component
const DialogDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-600 mb-4", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Description>
));
DialogDescription.displayName = "DialogDescription";

// DialogFooter component
const DialogFooter = ({ className, children, ...props }) => (
  <div
    className={cn("flex justify-end space-x-2 mt-4", className)}
    {...props}
  >
    {children}
  </div>
);
DialogFooter.displayName = "DialogFooter";

// Wrap the Radix Close component with forwardRef to ensure it's a function component
const DialogClose = React.forwardRef((props, ref) => (
  <DialogPrimitive.Close ref={ref} {...props} />
));
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
};
