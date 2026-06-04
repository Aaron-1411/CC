import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = "md", className, children, ...rest }, ref) => {
    const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white rounded-2xl shadow-card",
          hover && "transition-shadow duration-200 hover:shadow-card-hover",
          paddings[padding],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";
