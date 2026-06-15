"use client";

import { useEffect } from "react";
import { Save } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { saveBrand } from "@/app/admin/marcas/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utilidades";

type BrandFormValues = {
  name: string;
  slug: string;
};

// Crea marcas nuevas y previsualiza el slug que se guardara.
export function BrandForm() {
  const { register, control, setValue } = useForm<BrandFormValues>({
    defaultValues: {
      name: "",
      slug: "",
    },
  });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    setValue("slug", slugify(name), { shouldValidate: true });
  }, [name, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar marca</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={saveBrand} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="slug" value={slugify(name)} />
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" className="mt-2" {...register("name")} name="name" required />
          </div>
          <div>
            <Label htmlFor="slug">Slug automático</Label>
            <Input id="slug" className="mt-2" value={slugify(name)} readOnly disabled />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">
              <Save aria-hidden="true" />
              Guardar marca
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
