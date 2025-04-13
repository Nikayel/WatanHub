import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import { cn } from '../../lib/utils';

// The root Dialog component
const Dialog = DialogPrimitive.Root;

// Trigger for opening the dialog
const DialogTrigger = DialogPrimitive.Trigger;

// DialogContent with overlay and centered animation
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay 
      className={cn("fixed inset-0 bg-black/50 transition-opacity duration-300")}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-1/2 left-1/2 max-w-md w-full p-6 bg-white rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-fadeIn",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

// A simple header container for the dialog
const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn("mb-4", className)} {...props}>
    {children}
  </div>
);
DialogHeader.displayName = "DialogHeader";

// DialogTitle using Radix’s Title primitive with custom styles
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

// Wrap the Radix Close component with forwardRef to ensure it's a function component
const DialogClose = React.forwardRef((props, ref) => (
  <DialogPrimitive.Close ref={ref} {...props} />
));
DialogClose.displayName = "DialogClose";

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose };
