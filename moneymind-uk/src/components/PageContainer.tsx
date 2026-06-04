import { clsx } from "clsx";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow = false }: PageContainerProps) {
  return (
    <div className={clsx("mx-auto w-full px-4 sm:px-6 lg:px-8", narrow ? "max-w-3xl" : "max-w-6xl", className)}>
      {children}
    </div>
  );
}
