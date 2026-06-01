"use client";

import Image from "next/image";
import { Building2, CheckCircle2 } from "lucide-react";
import type { BankAccount } from "@/types/business";
import { cn } from "@/lib/utils";

interface BankAccountCardProps {
  account: BankAccount;
  selected: boolean;
  onSelect: () => void;
}

export function BankAccountCard({
  account,
  selected,
  onSelect,
}: BankAccountCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/15"
          : "border-border hover:border-primary/60",
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/10 bg-white p-1 shadow-sm">
          {account.logo ? (
            <Image
              src={account.logo.src}
              alt={account.logo.alt}
              width={account.logo.width}
              height={account.logo.height}
              className="h-full w-full rounded-md object-contain"
            />
          ) : (
            <Building2 className="size-5 text-primary" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="font-bold text-dark-blue">{account.bank}</span>
            {selected ? (
              <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
            ) : null}
          </span>
          <span className="mt-2 block text-sm text-muted-foreground">
            Titular: {account.owner}
          </span>
          {account.cedula ? (
            <span className="block text-sm text-muted-foreground">
              Cédula: {account.cedula}
            </span>
          ) : null}
          <span className="block text-sm text-muted-foreground">
            Cuenta de {account.accountType.toLowerCase()}: {account.accountNumber}
          </span>
        </span>
      </div>
    </button>
  );
}
