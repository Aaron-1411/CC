import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, MicOff, Smartphone, Save, WifiOff, Wifi, Trash2 } from "lucide-react";
import { useTrackTool } from "@/hooks/use-track-tool";
import { toastWithUndo } from "@/lib/toast-undo";

const CHECKLIST = [
  "Natural light at viewing time", "Mobile signal in every room", "Water pressure (kitchen + bathroom)",
  "Boiler age and condition", "Damp / mould / fresh paint patches", "Window seals & double glazing",
  "Loft / storage space", "Sound from neighbours, road, flight path", "Smell — drains, pets, damp",
  "Roof condition from outside", "Drains and gutters", "External walls — cracks, repointing",
  "Wifi signal in working areas", "Number and quality of plug sockets", "Kitchen appliances included?",
  "Bathroom condition & ventilation", "Floor levels — bouncy or sloping?", "Doors & windows open smoothly",
  "Any unauthorised extensions?", "Boundary fences & condition", "Garden orientation (sun morning vs evening)",
  "Parking — permit, off-street, visitor", "Bin storage location", "Communal areas (if flat)",
  "Lease length / service charge (if leasehold)", "Last 12 months bills shown?", "EPC matches reality?",
  "Local pubs / parks / schools walk-test", "Test commute at rush hour", "Walk back to station after dark",
  "Crime hotspots within 0.5 miles", "Planning notices on lampposts", "How long has it been listed?",
  "Why is the vendor selling?", "Any prior offers received?", "Chain status",
  "What's negotiable on price?", "Fixtures and fittings included?", "Survey-able as Level 2 or 3?",
  "Gut feel: would you walk back tomorrow?",
];

const STORAGE_KEY = "viewing-mode-v1";

interface Viewing {
  id: string; address: string; date: string; notes: string;
  voiceTranscript: string; checks: Record<string, boolean>; photos: string[];
}

function emptyViewing(): Viewing {
  return { id: crypto.randomUUID(), address: "", date: new Date().toISOString().slice(0, 10), notes: "", voiceTranscript: "", checks: {}, photos: [] };
}

export default function ViewingMode() {
  useTrackTool("viewing-mode");
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [current, setCurrent] = useState<Viewing>(emptyViewing());
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [recording, setRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => {
    try { setViewings(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { /* ignore */ }
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const persist = (next: Viewing[]) => {
    setViewings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const save = () => {
    const next = [current, ...viewings];
    persist(next);
    setCurrent(emptyViewing());
  };

  const remove = (id: string) => {
    const item = viewings.find(v => v.id === id);
    if (!item) return;
    const next = viewings.filter(v => v.id !== id);
    persist(next);
    toastWithUndo({ message: "Viewing deleted", onUndo: () => persist([item, ...next]) });
  };

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = () => setCurrent(c => ({ ...c, photos: [...c.photos, String(r.result)] }));
      r.readAsDataURL(f);
    });
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice transcription not supported on this browser. Try Chrome on Android."); return; }
    if (recording) { recRef.current?.stop(); setRecording(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-GB";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      let txt = "";
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + " ";
      setCurrent(c => ({ ...c, voiceTranscript: txt.trim() }));
    };
    rec.onend = () => setRecording(false);
    rec.start(); recRef.current = rec; setRecording(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Badge className="bg-brand-muted text-brand border-0 mb-2"><Smartphone className="w-3 h-3 mr-1.5" /> Saturday morning mode</Badge>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand">Viewing Mode</h1>
          <p className="mt-2 text-muted-foreground">Photos, voice notes, the 40-point checklist — works offline. Syncs when you're back on signal.</p>
        </div>
        <Badge variant="outline" className={online ? "" : "border-destructive text-destructive"}>
          {online ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
          {online ? "Online" : "Offline"}
        </Badge>
      </header>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-xs">Address</label><Input value={current.address} onChange={e => setCurrent({ ...current, address: e.target.value })} placeholder="14 Acacia Road, SW18" /></div>
          <div><label className="text-xs">Date</label><Input type="date" value={current.date} onChange={e => setCurrent({ ...current, date: e.target.value })} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Voice notes (live transcription)</label>
            <Button size="sm" variant={recording ? "destructive" : "outline"} onClick={toggleVoice}>
              {recording ? <><MicOff className="w-3.5 h-3.5 mr-1.5" /> Stop</> : <><Mic className="w-3.5 h-3.5 mr-1.5" /> Record</>}
            </Button>
          </div>
          <Textarea rows={3} value={current.voiceTranscript} onChange={e => setCurrent({ ...current, voiceTranscript: e.target.value })} placeholder="Tap record and walk through the property…" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Photos</label>
          <Input type="file" accept="image/*" capture="environment" multiple onChange={addPhoto} />
          {current.photos.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {current.photos.map((p, i) => <img key={i} src={p} alt={`Photo ${i + 1}`} className="rounded-md aspect-square object-cover" />)}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">40-point checklist</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto p-2 rounded-md bg-muted/30">
            {CHECKLIST.map(c => (
              <label key={c} className="flex items-start gap-2 text-sm cursor-pointer p-1 rounded hover:bg-background">
                <Checkbox checked={!!current.checks[c]} onCheckedChange={v => setCurrent(cur => ({ ...cur, checks: { ...cur.checks, [c]: !!v } }))} className="mt-0.5" />
                <span className="leading-tight">{c}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{Object.values(current.checks).filter(Boolean).length} of {CHECKLIST.length} checked</p>
        </div>

        <div>
          <label className="text-xs">Free-form notes</label>
          <Textarea rows={3} value={current.notes} onChange={e => setCurrent({ ...current, notes: e.target.value })} />
        </div>

        <Button onClick={save} disabled={!current.address} className="bg-brand text-brand-foreground hover:bg-brand/90 w-full">
          <Save className="w-4 h-4 mr-1.5" /> Save viewing
        </Button>
      </Card>

      {viewings.length > 0 && (
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold text-brand mb-3">Saved viewings ({viewings.length})</h2>
          <div className="space-y-2">
            {viewings.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-md border">
                <div className="min-w-0">
                  <p className="font-medium truncate">{v.address}</p>
                  <p className="text-xs text-muted-foreground">{v.date} · {v.photos.length} photos · {Object.values(v.checks).filter(Boolean).length}/{CHECKLIST.length} checks</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(v.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
