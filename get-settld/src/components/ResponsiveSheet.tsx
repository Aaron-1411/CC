// One pattern for "transient overlay" UIs:
//   • Mobile (<768px) → bottom Drawer (full-width, swipe-down)
//   • Desktop         → side Sheet
// Use this instead of mixing Dialog/Drawer/Sheet ad-hoc across pages.
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger,
} from "@/components/ui/drawer";

interface Props {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  /** Side for the desktop sheet (default right) */
  side?: "right" | "left";
}

export default function ResponsiveSheet({
  open, onOpenChange, title, description, trigger, children, side = "right",
}: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className="px-4 pb-6 max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="px-0">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side={side} className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
