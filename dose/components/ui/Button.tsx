import { forwardRef } from "react";

type Variant = "primary" | "pine" | "sun" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-bold text-center transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-raspberry text-white shadow-soft",
  pine: "bg-pine text-white shadow-soft",
  sun: "bg-sun text-ink shadow-soft",
  ghost: "bg-transparent text-pine hover:bg-pine/5",
  outline: "border-2 border-pine/15 bg-white text-pine hover:border-pine/30",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

function classes(variant: Variant, size: Size, className?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], className]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={classes(variant, size, className)}
        {...props}
      />
    );
  },
);

interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(
    { variant = "primary", size = "md", className, ...props },
    ref,
  ) {
    return (
      <a ref={ref} className={classes(variant, size, className)} {...props} />
    );
  },
);
