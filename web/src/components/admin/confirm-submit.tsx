"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type ConfirmSubmitProps = {
  children: string;
  message: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ConfirmSubmit({
  children,
  message,
  variant = "secondary",
  className = "",
}: ConfirmSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Memproses..." : children}
    </Button>
  );
}
