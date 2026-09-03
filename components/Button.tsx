import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-orange text-white hover:bg-orange-dark active:bg-orange-dark shadow-[0_1px_2px_rgba(26,29,33,0.18)]",
  outline:
    "border border-line-strong bg-paper text-ink hover:bg-paper-2 hover:border-ink-3 active:bg-paper-3",
  ghost: "text-ink-2 hover:bg-paper-3 hover:text-ink active:bg-line",
  subtle: "bg-paper-3 text-ink hover:bg-line active:bg-line-strong",
  danger: "bg-danger text-white hover:brightness-95 active:brightness-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-[6px]",
  md: "h-11 px-5 text-[15px] gap-2 rounded-[7px]",
  lg: "h-[52px] px-7 text-[16px] gap-2.5 rounded-[8px]",
};

const base =
  "inline-flex items-center justify-center font-medium whitespace-nowrap transition-[background,border,color,filter,box-shadow] duration-150 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange select-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
