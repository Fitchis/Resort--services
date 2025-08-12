"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { MenuItem } from "@/types/db";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function MenuAdminClient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery<{
    items: MenuItem[];
    categories: { id: string; name: string }[];
  }>({
    queryKey: ["menu-admin"],
    queryFn: async () => {
      const res = await fetch("/api/menu?all=1", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [draft, setDraft] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 1200,
    is_available: true,
  });
  const [diet, setDiet] = useState<{
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    allergens?: string;
  }>({});
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | "all">("all");
  const [hiddenOnly, setHiddenOnly] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  // Selection for batch actions
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filteredItems = useMemo(() => {
    return (data?.items ?? [])
      .filter((it) =>
        filterCat === "all" ? true : it.category_id === filterCat
      )
      .filter((it) =>
        (it.name + (it.description ?? ""))
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .filter((it) => (hiddenOnly ? !it.is_available : true));
  }, [data, filterCat, search, hiddenOnly]);
  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selected.has(i.id));
  const toggleSelect = (id: string, v: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleSelectAllVisible = (v: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (v) filteredItems.forEach((i) => next.add(i.id));
      else filteredItems.forEach((i) => next.delete(i.id));
      return next;
    });
  };
  const [editDraft, setEditDraft] = useState<Partial<MenuItem>>({});
  const [editDiet, setEditDiet] = useState<{
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    allergens?: string;
  }>({});
  const [editCategory, setEditCategory] = useState<string | undefined>(
    undefined
  );

  const create = useMutation({
    mutationFn: async (payload: Partial<MenuItem>) => {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      setDraft({ name: "", description: "", price: 1200, is_available: true });
      setDiet({});
      setCategory(undefined);
      toast({ title: "Item created" });
    },
    onError: (e: unknown) =>
      toast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  const update = useMutation({
    mutationFn: async (payload: Partial<MenuItem> & { id: string }) => {
      const res = await fetch(`/api/menu/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      toast({ title: "Item updated" });
      setEditingId(null);
    },
    onError: (e: unknown) =>
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      toast({ title: "Item deleted" });
    },
    onError: (e: unknown) =>
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  const batch = useMutation({
    mutationFn: async (args: {
      op: "show" | "hide" | "delete";
      ids: string[];
    }) => {
      if (args.op === "delete") {
        await Promise.all(
          args.ids.map((id) => fetch(`/api/menu/${id}`, { method: "DELETE" }))
        );
      } else {
        const is_available = args.op === "show";
        await Promise.all(
          args.ids.map((id) =>
            fetch(`/api/menu/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, is_available }),
            })
          )
        );
      }
      return { ok: true };
    },
    onSuccess: (_d, args) => {
      qc.invalidateQueries({ queryKey: ["menu-admin"] });
      setSelected(new Set());
      const label =
        args.op === "delete"
          ? "Deleted"
          : args.op === "show"
          ? "Shown"
          : "Hidden";
      toast({ title: `${label} ${args.ids.length} item(s)` });
    },
    onError: (e: unknown) =>
      toast({
        title: "Batch failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card border border-card">
        <CardHeader>
          <CardTitle className="text-base">Add new item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={draft.name || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={category ?? ""}
              onValueChange={(v) => setCategory(v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(data?.categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={draft.description || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Price (USD cents)</Label>
            <Input
              type="number"
              value={draft.price ?? 0}
              onChange={(e) =>
                setDraft((d) => ({ ...d, price: Number(e.target.value) }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Image URL</Label>
            <Input
              placeholder="/plated-meal.png"
              value={draft.image_url || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, image_url: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Dietary info</Label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={!!diet.vegetarian}
                  onCheckedChange={(v) =>
                    setDiet((d) => ({ ...d, vegetarian: !!v }))
                  }
                />
                Vegetarian
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={!!diet.vegan}
                  onCheckedChange={(v) =>
                    setDiet((d) => ({ ...d, vegan: !!v }))
                  }
                />
                Vegan
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={!!diet.glutenFree}
                  onCheckedChange={(v) =>
                    setDiet((d) => ({ ...d, glutenFree: !!v }))
                  }
                />
                Gluten-free
              </label>
            </div>
            <Input
              placeholder="Allergens (comma separated)"
              value={diet.allergens ?? ""}
              onChange={(e) =>
                setDiet((d) => ({ ...d, allergens: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Available</Label>
            <Switch
              checked={!!draft.is_available}
              onCheckedChange={(v) =>
                setDraft((d) => ({ ...d, is_available: v }))
              }
            />
          </div>
          <Button
            onClick={() =>
              create.mutate({
                ...draft,
                category_id: category,
                dietary_info: {
                  vegetarian: !!diet.vegetarian,
                  vegan: !!diet.vegan,
                  glutenFree: !!diet.glutenFree,
                  allergens: diet.allergens
                    ? diet.allergens
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    : undefined,
                },
              })
            }
            disabled={!draft.name}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border border-card">
        <CardHeader>
          <CardTitle className="text-base">Existing items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <Input
              placeholder="Search items"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterCat}
              onValueChange={(v) => setFilterCat(v as typeof filterCat)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(data?.categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={hiddenOnly}
                onCheckedChange={(v) => setHiddenOnly(!!v)}
              />
              Hidden only
            </label>
            <div className="flex items-center gap-2 ml-auto text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(v) => toggleSelectAllVisible(!!v)}
                />
                Select all
              </label>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-card bg-muted/40 p-2">
              <div className="text-sm text-muted-foreground">
                {selected.size} selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    batch.mutate({ op: "show", ids: Array.from(selected) })
                  }
                >
                  Show selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    batch.mutate({ op: "hide", ids: Array.from(selected) })
                  }
                >
                  Hide selected
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Delete selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete selected items?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          batch.mutate({
                            op: "delete",
                            ids: Array.from(selected),
                          })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          {filteredItems.map((it) => (
            <div
              key={it.id}
              className="grid gap-2 rounded-md border border-card bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={selected.has(it.id)}
                  onCheckedChange={(v) => toggleSelect(it.id, !!v)}
                  aria-label="Select item"
                />
                <div className="grow grid gap-2">
                  {editingId === it.id ? (
                    <>
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          value={editDraft.name ?? it.name}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editDraft.description ?? it.description ?? ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Price (USD cents)</Label>
                        <Input
                          type="number"
                          value={editDraft.price ?? it.price}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              price: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Image URL</Label>
                        <Input
                          value={editDraft.image_url ?? it.image_url ?? ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              image_url: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select
                          value={editCategory ?? it.category_id ?? ""}
                          onValueChange={(v) => setEditCategory(v || undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(data?.categories ?? []).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Dietary info</Label>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                !!(
                                  editDiet.vegetarian ??
                                  (it.dietary_info as any)?.vegetarian
                                )
                              }
                              onCheckedChange={(v) =>
                                setEditDiet((d) => ({ ...d, vegetarian: !!v }))
                              }
                            />
                            Vegetarian
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                !!(
                                  editDiet.vegan ??
                                  (it.dietary_info as any)?.vegan
                                )
                              }
                              onCheckedChange={(v) =>
                                setEditDiet((d) => ({ ...d, vegan: !!v }))
                              }
                            />
                            Vegan
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                !!(
                                  editDiet.glutenFree ??
                                  (it.dietary_info as any)?.glutenFree
                                )
                              }
                              onCheckedChange={(v) =>
                                setEditDiet((d) => ({ ...d, glutenFree: !!v }))
                              }
                            />
                            Gluten-free
                          </label>
                        </div>
                        <Input
                          placeholder="Allergens (comma separated)"
                          value={
                            editDiet.allergens ??
                            ((it.dietary_info as any)?.allergens || []).join(
                              ", "
                            )
                          }
                          onChange={(e) =>
                            setEditDiet((d) => ({
                              ...d,
                              allergens: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft({});
                            setEditDiet({});
                            setEditCategory(undefined);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            update.mutate({
                              id: it.id,
                              ...editDraft,
                              category_id: editCategory ?? it.category_id,
                              dietary_info: {
                                vegetarian: !!(
                                  editDiet.vegetarian ??
                                  (it.dietary_info as any)?.vegetarian
                                ),
                                vegan: !!(
                                  editDiet.vegan ??
                                  (it.dietary_info as any)?.vegan
                                ),
                                glutenFree: !!(
                                  editDiet.glutenFree ??
                                  (it.dietary_info as any)?.glutenFree
                                ),
                                allergens: (
                                  editDiet.allergens ??
                                  (
                                    (it.dietary_info as any)?.allergens || []
                                  ).join(", ")
                                )
                                  .split(",")
                                  .map((s: string) => s.trim())
                                  .filter(Boolean),
                              },
                            })
                          }
                        >
                          Save changes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.description}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">
                          ${(it.price / 100).toFixed(2)}
                        </span>
                        {it.is_available ? (
                          <Badge
                            className="bg-green-500/20 text-green-600 dark:text-green-300"
                            variant="secondary"
                          >
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground"
                          >
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Category:{" "}
                        {data?.categories.find((c) => c.id === it.category_id)
                          ?.name ?? "—"}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              update.mutate({
                                id: it.id,
                                is_available: !it.is_available,
                              })
                            }
                          >
                            Toggle availability
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(it.id);
                              setEditDraft({});
                              setEditCategory(it.category_id);
                              setEditDiet({
                                vegetarian: (it.dietary_info as any)
                                  ?.vegetarian,
                                vegan: (it.dietary_info as any)?.vegan,
                                glutenFree: (it.dietary_info as any)
                                  ?.glutenFree,
                                allergens: (
                                  (it.dietary_info as any)?.allergens || []
                                ).join(", "),
                              });
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this item?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The item will be
                                permanently removed from the menu.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => del.mutate(it.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(data?.items?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">No items yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
