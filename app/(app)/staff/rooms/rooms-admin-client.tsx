"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  QrCode,
  Download,
  Printer,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@/types/db";

type RoomUpdatePayload = {
  room_number: string;
  status?: Room["status"];
  current_guest?: string | null;
  qr_code_url?: string | null;
};
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

const statusOptions = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "cleaning", label: "Cleaning" },
];

export default function RoomsAdminClient() {
  const qc = useQueryClient();
  const { data } = useQuery<{ rooms: Room[] }>({
    queryKey: ["rooms-admin"],
    queryFn: async () => {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const [search, setSearch] = useState("");
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    room_number: "",
    status: "vacant" as Room["status"],
    current_guest: "",
    qr_code_url: "",
  });

  const filtered = useMemo(() => {
    const list = data?.rooms ?? [];
    return list.filter((r) =>
      (r.room_number + (r.current_guest ?? "") + (r.status || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  const create = useMutation({
    mutationFn: async (payload: Partial<Room>) => {
      const sanitized = {
        ...payload,
        current_guest:
          typeof payload.current_guest === "string" &&
          payload.current_guest.trim().length === 0
            ? null
            : payload.current_guest,
        qr_code_url:
          typeof payload.qr_code_url === "string" &&
          payload.qr_code_url.trim().length === 0
            ? null
            : payload.qr_code_url,
      };
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-admin"] });
      setNewRoom({
        room_number: "",
        status: "vacant",
        current_guest: "",
        qr_code_url: "",
      });
    },
  });

  const update = useMutation({
    mutationFn: async (
      payload: (Partial<Room> & { room_number: string }) | RoomUpdatePayload
    ) => {
      const sanitized: RoomUpdatePayload = {
        room_number: payload.room_number,
        status: (payload as any).status,
        current_guest:
          typeof (payload as any).current_guest === "string"
            ? ((payload as any).current_guest as string).trim().length > 0
              ? ((payload as any).current_guest as string).trim()
              : null
            : (payload as any).current_guest,
        qr_code_url:
          typeof (payload as any).qr_code_url === "string"
            ? ((payload as any).qr_code_url as string).trim().length > 0
              ? ((payload as any).qr_code_url as string).trim()
              : null
            : (payload as any).qr_code_url,
      };
      const res = await fetch(`/api/rooms/${payload.room_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-admin"] });
    },
  });

  const del = useMutation({
    mutationFn: async (room_number: string) => {
      const res = await fetch(`/api/rooms/${room_number}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms-admin"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card border border-card">
        <CardHeader>
          <CardTitle className="text-base">Add new room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Room number</Label>
            <Input
              value={newRoom.room_number || ""}
              onChange={(e) =>
                setNewRoom((d) => ({ ...d, room_number: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={newRoom.status || "vacant"}
              onValueChange={(v) =>
                setNewRoom((d) => ({ ...d, status: v as Room["status"] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Current guest (optional)</Label>
            <Input
              value={newRoom.current_guest || ""}
              onChange={(e) =>
                setNewRoom((d) => ({ ...d, current_guest: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>QR code URL (optional)</Label>
            <Input
              placeholder="https://..."
              value={newRoom.qr_code_url || ""}
              onChange={(e) =>
                setNewRoom((d) => ({ ...d, qr_code_url: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={() => create.mutate(newRoom)}
            disabled={!newRoom.room_number}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border border-card">
        <CardHeader>
          <CardTitle className="text-base">Existing rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search rooms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          {(filtered ?? []).map((r) => (
            <RoomRow
              key={r.room_number}
              room={r}
              onUpdate={update.mutateAsync}
              onDelete={del.mutate}
            />
          ))}
          {(filtered?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">No rooms.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RoomRow({
  room,
  onUpdate,
  onDelete,
}: {
  room: Room;
  onUpdate: (payload: RoomUpdatePayload) => Promise<unknown>;
  onDelete: (room_number: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(false);
  const [guestDraft, setGuestDraft] = useState<string>(
    room.current_guest || ""
  );
  const [savingGuest, setSavingGuest] = useState(false);
  const { toast } = useToast();
  const { data, refetch, isFetching } = useQuery<{
    orders: Array<{
      id: string;
      room_number: string;
      status: RoomStatus;
      total_amount: number;
      created_at: string;
    }>;
  }>({
    queryKey: ["room-orders", room.room_number, open],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${room.room_number}/orders?limit=5`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: open,
  });

  type RoomStatus = "received" | "preparing" | "ready" | "delivered";

  return (
    <div className="grid gap-2 rounded-md border border-card bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1 min-w-0">
          <button
            className="flex items-center gap-2 text-left min-w-0"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) refetch();
            }}
            aria-expanded={open}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium truncate">
              Room {room.room_number}
            </span>
          </button>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="capitalize">{room.status}</span>
            <span>•</span>
            {!editingGuest ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>
                  Guest:{" "}
                  {room.current_guest && room.current_guest.length > 0
                    ? room.current_guest
                    : "—"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => {
                    setGuestDraft(room.current_guest || "");
                    setEditingGuest(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                <Input
                  value={guestDraft}
                  onChange={(e) => setGuestDraft(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !savingGuest) {
                      e.preventDefault();
                      try {
                        setSavingGuest(true);
                        await onUpdate({
                          room_number: room.room_number,
                          current_guest: guestDraft.trim().length
                            ? guestDraft.trim()
                            : null,
                        });
                        setEditingGuest(false);
                        toast({ title: "Guest updated" });
                      } catch (e) {
                        toast({
                          title: "Failed to update guest",
                          description:
                            e instanceof Error ? e.message : "Unknown error",
                          variant: "destructive",
                        });
                      } finally {
                        setSavingGuest(false);
                      }
                    } else if (e.key === "Escape" && !savingGuest) {
                      e.preventDefault();
                      setEditingGuest(false);
                      setGuestDraft(room.current_guest || "");
                    }
                  }}
                  placeholder="Guest name (empty to clear)"
                  className="h-7 w-48 sm:w-56 md:w-64 max-w-full min-w-0"
                  maxLength={80}
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  disabled={savingGuest}
                  onClick={async () => {
                    try {
                      setSavingGuest(true);
                      await onUpdate({
                        room_number: room.room_number,
                        current_guest: guestDraft.trim().length
                          ? guestDraft.trim()
                          : null,
                      });
                      setEditingGuest(false);
                      toast({ title: "Guest updated" });
                    } catch (e) {
                      toast({
                        title: "Failed to update guest",
                        description:
                          e instanceof Error ? e.message : "Unknown error",
                        variant: "destructive",
                      });
                    } finally {
                      setSavingGuest(false);
                    }
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  disabled={savingGuest}
                  onClick={() => {
                    setEditingGuest(false);
                    setGuestDraft(room.current_guest || "");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            )}
          </div>
          {room.qr_code_url && (
            <a
              href={room.qr_code_url}
              className="text-xs text-primary underline truncate"
              target="_blank"
              rel="noreferrer"
            >
              QR link
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          <Select
            value={room.status}
            onValueChange={(v) =>
              onUpdate({
                room_number: room.room_number,
                status: v as Room["status"],
              })
            }
          >
            <SelectTrigger className="w-32 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!editingGuest && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onUpdate({
                  room_number: room.room_number,
                  current_guest: room.current_guest ? null : "Guest",
                })
              }
            >
              {room.current_guest ? "Clear guest" : "Set guest"}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The room will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(room.room_number)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <RoomQrActions
            roomNumber={room.room_number}
            onCopied={() => toast({ title: "Link copied" })}
          />
        </div>
      </div>
      {open && (
        <div className="rounded-md border border-card bg-muted/30 p-2">
          <div className="text-xs font-medium mb-2">Recent orders</div>
          {isFetching && (
            <div className="text-xs text-muted-foreground">Loading…</div>
          )}
          {(data?.orders ?? []).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 text-xs py-1"
            >
              <div className="truncate">
                #{o.id.slice(0, 6)} • {new Date(o.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {o.status}
                </Badge>
                <span className="font-semibold">
                  ${(o.total_amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {(data?.orders?.length ?? 0) === 0 && !isFetching && (
            <div className="text-xs text-muted-foreground">
              No recent orders
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoomQrActions({
  roomNumber,
  onCopied,
}: {
  roomNumber: string;
  onCopied?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${encodeURIComponent(roomNumber)}`
      : `/room/${encodeURIComponent(roomNumber)}`;

  async function ensureQr() {
    if (dataUrl || loading) return;
    try {
      setLoading(true);
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(roomUrl, { width: 256, margin: 1 });
      setDataUrl(url);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      onCopied?.();
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = roomUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onCopied?.();
    }
  }

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `room-${roomNumber}-qr.png`;
    a.click();
  }

  function printQr() {
    if (!dataUrl) return;
    const w = window.open("");
    if (!w) return;
    w.document.write(
      `<img src="${dataUrl}" style="width:320px;height:320px;" />`
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Copy className="h-4 w-4 mr-1" /> Copy link
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) ensureQr();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-1" /> QR
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room {roomNumber} QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {loading && (
              <div className="text-sm text-muted-foreground">Generating…</div>
            )}
            {dataUrl && (
              <img
                src={dataUrl}
                alt={`QR for room ${roomNumber}`}
                className="rounded-md border"
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadPng}
                disabled={!dataUrl}
              >
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={printQr}
                disabled={!dataUrl}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
            <div className="text-xs text-muted-foreground break-all max-w-full">
              {roomUrl}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
