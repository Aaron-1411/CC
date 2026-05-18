import { useEffect, useMemo, useState } from "react";
import { Heart, Image as ImageIcon, Link2, Pencil, Plus, Tag, Trash2, Upload, X, Sparkles, Loader2, ChevronDown, ChevronUp, Train } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import {
  addProperty,
  fileToDataUrl,
  listProperties,
  removeProperty,
  type SavedProperty,
  type ShortlistSource,
  updateProperty,
} from "@/lib/shortlist";
import { parseListingUrl, ListingParseError, SUPPORTED_LISTING_LABEL } from "@/lib/listing";
import ShortlistTransportCompare from "@/components/ShortlistTransportCompare";
import { EmptyState } from "@/components/states";
import { toastWithUndo } from "@/lib/toast-undo";
import { AlertCircle } from "lucide-react";

interface DraftFields {
  address: string;
  area: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  url: string;
  tags: string;
  notes: string;
}

const emptyDraft: DraftFields = {
  address: "",
  area: "",
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  url: "",
  tags: "",
  notes: "",
};

function toNum(v: string): number | undefined {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatPrice(n?: number) {
  if (!n) return "-";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export default function Shortlist() {
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [draft, setDraft] = useState<DraftFields>(emptyDraft);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<ShortlistSource>("url");
  const [addOpen, setAddOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<SavedProperty | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<{ message: string; hint: string } | null>(null);

  async function importFromUrl() {
    if (!draft.url.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const r = await parseListingUrl(draft.url.trim());
      setDraft((d) => ({
        ...d,
        address: r.address ?? d.address,
        area: r.postcode ?? d.area,
        price: r.price ? String(r.price) : d.price,
        beds: r.beds ? String(r.beds) : d.beds,
        baths: r.baths ? String(r.baths) : d.baths,
        sqft: r.sqft ? String(r.sqft) : d.sqft,
      }));
      if (r.imageUrl) setImageDataUrl(r.imageUrl);
      toast({ title: "Listing imported", description: "Review the details and save." });
    } catch (e) {
      const err = e instanceof ListingParseError
        ? { message: e.message, hint: e.hint }
        : { message: "Couldn't read that listing", hint: "Try again, or switch to Manual entry." };
      setImportError(err);
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    listProperties().then(setItems);
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const q = filter.toLowerCase();
    return items.filter(
      (i) =>
        i.address.toLowerCase().includes(q) ||
        (i.area ?? "").toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        (i.notes ?? "").toLowerCase().includes(q),
    );
  }, [items, filter]);

  function reset() {
    setDraft(emptyDraft);
    setImageDataUrl(undefined);
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Not an image", description: "Please choose a PNG or JPG screenshot." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please use an image under 5 MB." });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setImageDataUrl(dataUrl);
  }

  async function onSave() {
    if (!draft.address.trim()) {
      toast({ title: "Address required", description: "Add at least an address or property name." });
      return;
    }
    if (tab === "screenshot" && !imageDataUrl) {
      toast({ title: "Screenshot missing", description: "Upload a screenshot or switch to Manual." });
      return;
    }
    if (tab === "url" && !draft.url.trim()) {
      toast({ title: "URL required", description: "Paste a Rightmove / Zoopla / agent link." });
      return;
    }
    try {
      await addProperty({
        source: tab,
        address: draft.address.trim(),
        area: draft.area.trim() || undefined,
        price: toNum(draft.price),
        beds: toNum(draft.beds),
        baths: toNum(draft.baths),
        sqft: toNum(draft.sqft),
        url: draft.url.trim() || undefined,
        imageDataUrl,
        tags: parseTags(draft.tags),
        notes: draft.notes.trim() || undefined,
      });
      setItems(await listProperties());
      reset();
      toast({ title: "Saved", description: "Added to your shortlist." });
    } catch (e) {
      toast({ title: "Could not save", description: String((e as Error).message), variant: "destructive" });
    }
  }

  async function onDelete(id: string) {
    const item = items.find((p) => p.id === id);
    if (!item) return;
    await removeProperty(id);
    setItems(await listProperties());
    toastWithUndo({
      message: "Property removed",
      description: item.address,
      onUndo: async () => {
        // Re-add: addProperty regenerates id but preserves data
        await addProperty({
          source: item.source,
          address: item.address,
          area: item.area,
          price: item.price,
          beds: item.beds,
          baths: item.baths,
          sqft: item.sqft,
          url: item.url,
          imageDataUrl: item.imageDataUrl,
          tags: item.tags,
          notes: item.notes,
        });
        setItems(await listProperties());
      },
    });
  }

  async function onSaveEdit() {
    if (!editing) return;
    await updateProperty(editing.id, editing);
    setItems(await listProperties());
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shortlist"
        title="Saved properties"
        description="Save homes you like from anywhere - paste a Rightmove link, drop a screenshot, or type the details. Add tags and notes to keep your thinking with each property."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Compact toolbar — single primary CTA opens an Add sheet so the form
            doesn't dominate the page once you have saves. */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand">Your shortlist</h2>
            <p className="text-sm text-muted-foreground">
              {items.length} saved {items.length === 1 ? "property" : "properties"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="sm:w-56"
            />
            <Sheet open={addOpen} onOpenChange={setAddOpen}>
              <SheetTrigger asChild>
                <Button className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Plus className="h-4 w-4" /> Add property
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add a property</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as ShortlistSource)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="url" className="gap-1.5 text-xs">
                        <Link2 className="h-3.5 w-3.5" /> URL
                      </TabsTrigger>
                      <TabsTrigger value="screenshot" className="gap-1.5 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" /> Screenshot
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="gap-1.5 text-xs">
                        <Pencil className="h-3.5 w-3.5" /> Manual
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="mt-5 space-y-4">
                      <div>
                        <Label htmlFor="prop-url">Listing URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="prop-url"
                            placeholder="https://www.rightmove.co.uk/properties/..."
                            value={draft.url}
                            onChange={(e) => { setDraft({ ...draft, url: e.target.value }); if (importError) setImportError(null); }}
                            aria-invalid={importError ? true : undefined}
                            aria-describedby={importError ? "prop-url-error" : "prop-url-hint"}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={importFromUrl}
                            disabled={importing || !draft.url.trim()}
                          >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" /> Auto-fill</>}
                          </Button>
                        </div>
                        {importError ? (
                          <div
                            id="prop-url-error"
                            role="alert"
                            className="mt-2 flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
                          >
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <p className="font-medium text-destructive">{importError.message}</p>
                              <p className="text-muted-foreground leading-relaxed">{importError.hint}</p>
                              <button
                                type="button"
                                onClick={() => { setImportError(null); setTab("manual"); }}
                                className="font-medium text-brand hover:underline"
                              >
                                Switch to manual entry →
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p id="prop-url-hint" className="text-xs text-muted-foreground mt-1">
                            Works with {SUPPORTED_LISTING_LABEL}. We'll pull the address, price, beds, baths and floor area.
                          </p>
                        )}
                      </div>
                      <SharedFields draft={draft} setDraft={setDraft} />
                    </TabsContent>

                    <TabsContent value="screenshot" className="mt-5 space-y-4">
                      <div>
                        <Label>Screenshot</Label>
                        {imageDataUrl ? (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={imageDataUrl}
                              alt="Property screenshot preview"
                              className="max-h-64 rounded-md border"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={() => setImageDataUrl(undefined)}
                              aria-label="Remove screenshot"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md py-8 cursor-pointer hover:bg-muted/40 transition-colors">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center px-2">
                              Upload a screenshot from Rightmove, Zoopla or an agent's site
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                            />
                          </label>
                        )}
                      </div>
                      <SharedFields draft={draft} setDraft={setDraft} />
                    </TabsContent>

                    <TabsContent value="manual" className="mt-5 space-y-4">
                      <SharedFields draft={draft} setDraft={setDraft} />
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button
                      onClick={async () => { await onSave(); setAddOpen(false); }}
                      className="bg-brand text-brand-foreground hover:bg-brand/90 flex-1"
                    >
                      <Heart className="h-4 w-4" /> Save to shortlist
                    </Button>
                    <Button variant="outline" onClick={reset}>Clear</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="text-xs"
                aria-label={`Filter by tag ${t}`}
              >
                <Badge variant="secondary" className="cursor-pointer">
                  <Tag className="h-3 w-3 mr-1" /> {t}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Transport compare — collapsed by default. The map is heavy and
            most users only want it when actively comparing. */}
        {filtered.length >= 2 && (
          <div className="border rounded-lg bg-card">
            <button
              type="button"
              onClick={() => setTransportOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 rounded-lg"
              aria-expanded={transportOpen}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Train className="h-4 w-4 text-brand" />
                Transport comparison
                <Badge variant="secondary" className="text-[10px]">{filtered.length} properties</Badge>
              </span>
              {transportOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {transportOpen && (
              <div className="px-4 pb-4">
                <ShortlistTransportCompare properties={filtered} />
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          items.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No saved properties yet"
              description="Paste a Rightmove or Zoopla link to import a property in seconds — or upload a screenshot."
              action={
                <Button onClick={() => setAddOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Plus className="h-4 w-4" /> Add your first property
                </Button>
              }
            />
          ) : (
            <EmptyState title={`No properties match "${filter}".`} />
          )
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} className="overflow-hidden flex flex-col">
                  {p.imageDataUrl && (
                    <img
                      src={p.imageDataUrl}
                      alt={`Screenshot of ${p.address}`}
                      className="w-full h-40 object-cover bg-muted"
                    />
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight truncate">{p.address}</h3>
                        {p.area && <p className="text-xs text-muted-foreground">{p.area}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditing(p)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(p.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-brand">{formatPrice(p.price)}</div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.beds != null && <span>{p.beds} bed</span>}
                      {p.baths != null && <span>{p.baths} bath</span>}
                      {p.sqft != null && <span>{p.sqft} sqft</span>}
                    </div>

                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {p.notes && <p className="text-sm text-muted-foreground line-clamp-3">{p.notes}</p>}

                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-brand hover:underline mt-auto inline-flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" /> Open listing
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">Edit property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Address</Label>
                <Input
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Area</Label>
                  <Input
                    value={editing.area ?? ""}
                    onChange={(e) => setEditing({ ...editing, area: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Price (£)</Label>
                  <Input
                    inputMode="numeric"
                    value={editing.price ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, price: Number(e.target.value) || undefined })
                    }
                  />
                </div>
                <div>
                  <Label>Beds</Label>
                  <Input
                    inputMode="numeric"
                    value={editing.beds ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, beds: Number(e.target.value) || undefined })
                    }
                  />
                </div>
                <div>
                  <Label>Baths</Label>
                  <Input
                    inputMode="numeric"
                    value={editing.baths ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, baths: Number(e.target.value) || undefined })
                    }
                  />
                </div>
                <div>
                  <Label>Sqft</Label>
                  <Input
                    inputMode="numeric"
                    value={editing.sqft ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, sqft: Number(e.target.value) || undefined })
                    }
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={editing.url ?? ""}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={editing.tags.join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: parseTags(e.target.value) })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={onSaveEdit} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SharedFields({
  draft,
  setDraft,
}: {
  draft: DraftFields;
  setDraft: (d: DraftFields) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Label htmlFor="f-address">Address / property name</Label>
        <Input
          id="f-address"
          placeholder="42 Cherry Tree Lane, SW18"
          value={draft.address}
          onChange={(e) => setDraft({ ...draft, address: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-area">Area</Label>
        <Input
          id="f-area"
          placeholder="Earlsfield"
          value={draft.area}
          onChange={(e) => setDraft({ ...draft, area: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-price">Asking price (£)</Label>
        <Input
          id="f-price"
          inputMode="numeric"
          placeholder="525000"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-beds">Beds</Label>
        <Input
          id="f-beds"
          inputMode="numeric"
          value={draft.beds}
          onChange={(e) => setDraft({ ...draft, beds: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-baths">Baths</Label>
        <Input
          id="f-baths"
          inputMode="numeric"
          value={draft.baths}
          onChange={(e) => setDraft({ ...draft, baths: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="f-sqft">Sqft</Label>
        <Input
          id="f-sqft"
          inputMode="numeric"
          value={draft.sqft}
          onChange={(e) => setDraft({ ...draft, sqft: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="f-tags">Tags (comma separated)</Label>
        <Input
          id="f-tags"
          placeholder="favourite, needs work, garden"
          value={draft.tags}
          onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="f-notes">Notes</Label>
        <Textarea
          id="f-notes"
          rows={3}
          placeholder="What did you like? Concerns? Questions for the agent?"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
