"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPanel() {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Integrar Supabase Auth, sesiones, roles admin y RLS.
    router.push("/admin");
  };

  return (
    <Card className="border-primary/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
          Iniciar sesión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              className="mt-2"
              defaultValue="admin@pescaconfe.com"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              className="mt-2"
              defaultValue="demo1234"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Entrar al panel
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Volver a la tienda</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
