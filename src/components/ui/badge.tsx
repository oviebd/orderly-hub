import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pending: "border-transparent bg-status-pending text-status-pending-foreground",
        confirmed: "border-transparent bg-status-confirmed text-status-confirmed-foreground",
        delivered: "border-transparent bg-status-delivered text-status-delivered-foreground",
        cancelled: "border-transparent bg-status-cancelled text-status-cancelled-foreground",
        whatsapp: "border-transparent bg-source-whatsapp/15 text-source-whatsapp",
        messenger: "border-transparent bg-source-messenger/15 text-source-messenger",
        phone: "border-transparent bg-source-phone/15 text-source-phone",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
