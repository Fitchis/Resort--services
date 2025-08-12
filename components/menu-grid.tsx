"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { MenuItem } from "@/types/db";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function MenuGrid() {
  const { data, isLoading, isError } = useQuery<{
    categories: { id: string; name: string }[];
    items: MenuItem[];
  }>({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const add = useCartStore((s) => s.add);
  const { toast } = useToast();
  const decrement = useCartStore((s) => s.decrement);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  }>({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const matchDiet = (info?: MenuItem["dietary_info"]) => {
      if (!info) return true;
      if (filters.vegetarian && !info.vegetarian) return false;
      if (filters.vegan && !info.vegan) return false;
      if (filters.glutenFree && !info.glutenFree) return false;
      return true;
    };
    return {
      items: (data?.items ?? []).filter(
        (i) =>
          i.is_available &&
          (i.name.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)) &&
          matchDiet(i.dietary_info)
      ),
      categories: data?.categories ?? [],
    };
  }, [data, query, filters]);

  if (isLoading) return <div>Loading menu...</div>;
  if (isError)
    return <div className="text-destructive">Failed to load menu.</div>;

  function handleAdd(item: MenuItem) {
    // Add to cart
    add(item);
    // Read updated state for feedback
    try {
      const state = (useCartStore as any).getState?.() || {};
      const items = state.items as Array<{
        quantity: number;
        unit_price: number;
      }>;
      const count = Array.isArray(items)
        ? items.reduce((n, i) => n + (i.quantity ?? 0), 0)
        : undefined;
      const total =
        typeof state.total === "function" ? state.total() : undefined;
      toast({
        title: `Added to cart`,
        description:
          typeof count === "number" && typeof total === "number"
            ? `${item.name} • ${count} item${count === 1 ? "" : "s"} • $${(
                total / 100
              ).toFixed(2)}`
            : item.name,
        action: (
          <ToastAction altText="Undo" onClick={() => decrement(item.id)}>
            Undo
          </ToastAction>
        ),
      });
    } catch {
      toast({
        title: `Added to cart`,
        description: item.name,
        action: (
          <ToastAction altText="Undo" onClick={() => decrement(item.id)}>
            Undo
          </ToastAction>
        ),
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes, e.g., pasta"
          aria-label="Search menu"
        />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-md border border-muted bg-card p-2 text-sm text-card-foreground">
          <Filter className="h-4 w-4" />
          <label className="flex items-center gap-2">
            <Checkbox
              checked={!!filters.vegetarian}
              onCheckedChange={(v) =>
                setFilters((f) => ({ ...f, vegetarian: !!v }))
              }
            />
            Vegetarian
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={!!filters.vegan}
              onCheckedChange={(v) => setFilters((f) => ({ ...f, vegan: !!v }))}
            />
            Vegan
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={!!filters.glutenFree}
              onCheckedChange={(v) =>
                setFilters((f) => ({ ...f, glutenFree: !!v }))
              }
            />
            Gluten-free
          </label>
        </div>
      </div>

      <Tabs defaultValue={filtered.categories[0]?.id ?? "all"}>
        <TabsList className="flex w-full flex-wrap gap-2 bg-transparent">
          <TabsTrigger key="all" value="all">
            All
          </TabsTrigger>
          {filtered.categories.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              {c.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <MenuGridList items={filtered.items} onAdd={handleAdd} />
        </TabsContent>
        {filtered.categories.map((c) => (
          <TabsContent key={c.id} value={c.id} className="mt-4">
            <MenuGridList
              items={filtered.items.filter((i) => i.category_id === c.id)}
              onAdd={handleAdd}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MenuGridList({
  items = [],
  onAdd = () => {},
}: {
  items?: MenuItem[];
  onAdd?: (item: MenuItem) => void;
}) {
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">No items found.</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className="bg-card text-card-foreground border border-card"
        >
          <CardHeader className="space-y-2">
            <div className="relative h-40 w-full overflow-hidden rounded-md">
              <Image
                src={
                  item.image_url ||
                  `/placeholder.svg?height=160&width=320&query=food+dish+presentation`
                }
                alt={item.name}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
              />
            </div>
            <CardTitle className="grid grid-cols-[1fr_auto] items-start gap-2 text-base">
              <span className="break-words">{item.name}</span>
              <span className="text-primary whitespace-nowrap">
                ${(item.price / 100).toFixed(2)}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              {item.dietary_info?.vegetarian && (
                <Badge variant="outline">Vegetarian</Badge>
              )}
              {item.dietary_info?.vegan && (
                <Badge variant="outline">Vegan</Badge>
              )}
              {item.dietary_info?.glutenFree && (
                <Badge variant="outline">Gluten-free</Badge>
              )}
              {item.dietary_info?.allergens?.length ? (
                <Badge variant="destructive">
                  Allergens: {item.dietary_info.allergens.join(", ")}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => onAdd(item)}>
              <Plus className="mr-2 h-4 w-4" />
              Add to cart
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
