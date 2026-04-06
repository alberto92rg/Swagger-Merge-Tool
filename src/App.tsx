import React, { useMemo, useRef, useState } from "react";
import YAML from "yaml";
import {
  Upload,
  FileText,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Download,
  FileDown,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type DiffRow = {
  type: "same" | "removed" | "added";
  oldLine: string;
  newLine: string;
  oldNumber: number | "";
  newNumber: number | "";
};

type ApiChange = {
  label: string;
  detail: string;
  group: "Paths" | "Definitions" | "Tags" | "Metadati";
};

type Status = "idle" | "loading" | "success" | "error";

type ConvertedDocInfo = {
  label: string;
  detail: string;
  kind: "swagger" | "openapi" | "json";
};

const norm = (text: string) => String(text || "").replace(/\r\n?/g, "\n");
const parseYaml = (text: string): Record<string, any> => {
  if (!text.trim()) return {};
  return (YAML.parse(text) || {}) as Record<string, any>;
};
const parseJson = (text: string): unknown => {
  if (!text.trim()) return {};
  return JSON.parse(text);
};
const toYaml = (obj: unknown) => YAML.stringify(obj ?? {});
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v ?? null));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const createYamlFilename = (name: string, fallback: string) => {
  const safeName = name.trim();
  if (!safeName) return fallback;
  if (/\.json$/i.test(safeName)) return safeName.replace(/\.json$/i, ".yaml");
  if (/\.ya?ml$/i.test(safeName)) return safeName;
  return `${safeName}.yaml`;
};

function describeConvertedDocument(doc: unknown): ConvertedDocInfo {
  const fallback: ConvertedDocInfo = {
    label: "JSON convertito",
    detail: "Il contenuto è stato trasformato in YAML e può essere caricato nei pannelli sottostanti.",
    kind: "json",
  };

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return fallback;

  const record = doc as Record<string, any>;
  const titleSuffix = typeof record.info?.title === "string" ? ` · ${record.info.title}` : "";

  if (record.swagger === "2.0") {
    return {
      label: `Swagger 2.0 rilevato${titleSuffix}`,
      detail: "La specifica è pronta per essere letta e usata direttamente come Swagger base o Swagger aggiornato.",
      kind: "swagger",
    };
  }

  if (typeof record.openapi === "string") {
    return {
      label: `OpenAPI ${record.openapi} rilevato${titleSuffix}`,
      detail: "La conversione JSON → YAML è riuscita. Il flusso attuale del merge resta compatibile con il comportamento già presente nel tool.",
      kind: "openapi",
    };
  }

  return fallback;
}

function deepMerge(a: Record<string, any>, b: Record<string, any>) {
  const out = clone(a || {});
  Object.keys(b || {}).forEach((k) => {
    const av = out[k];
    const bv = b[k];
    out[k] = av && bv && typeof av === "object" && typeof bv === "object" && !Array.isArray(av) && !Array.isArray(bv)
      ? deepMerge(av, bv)
      : clone(bv);
  });
  return out;
}

function mergeSwagger(oldText: string, newText: string) {
  const oldDoc = parseYaml(oldText);
  const newDoc = parseYaml(newText);
  const merged = clone(oldDoc || {});

  if (newDoc.swagger) merged.swagger = newDoc.swagger;
  if (newDoc.info) merged.info = clone(newDoc.info);
  if ("basePath" in oldDoc) merged.basePath = clone(oldDoc.basePath); else delete merged.basePath;
  if ("host" in oldDoc) merged.host = clone(oldDoc.host); else delete merged.host;
  if ("schemes" in oldDoc) merged.schemes = clone(oldDoc.schemes); else delete merged.schemes;
  if ("consumes" in newDoc) merged.consumes = clone(newDoc.consumes);
  if ("produces" in newDoc) merged.produces = clone(newDoc.produces);

  merged.paths = deepMerge(oldDoc.paths || {}, newDoc.paths || {});
  merged.definitions = deepMerge(oldDoc.definitions || {}, newDoc.definitions || {});
  merged.parameters = deepMerge(oldDoc.parameters || {}, newDoc.parameters || {});
  merged.responses = deepMerge(oldDoc.responses || {}, newDoc.responses || {});
  merged.securityDefinitions = deepMerge(oldDoc.securityDefinitions || {}, newDoc.securityDefinitions || {});

  const tagMap = new Map<string, any>();
  [...arr<any>(oldDoc.tags), ...arr<any>(newDoc.tags)].forEach((t) => t?.name && tagMap.set(t.name, t));
  if (tagMap.size) merged.tags = [...tagMap.values()];

  Object.keys(newDoc).forEach((k) => {
    if (!(k in merged)) merged[k] = clone(newDoc[k]);
  });

  return { oldDoc, mergedDoc: merged, mergedText: toYaml(merged) };
}

function validateMerged(text: string) {
  if (!text.trim()) return { valid: false, message: "Nessun contenuto merged da scaricare." };
  const parsed = parseYaml(text);
  if (parsed.swagger !== "2.0") return { valid: false, message: 'Il campo swagger deve essere "2.0".' };
  if (!parsed.info) return { valid: false, message: "Sezione info mancante." };
  if (!parsed.paths || !Object.keys(parsed.paths).length) return { valid: false, message: "Sezione paths mancante o vuota." };
  return { valid: true, message: "Validazione completata con successo." };
}

function download(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildApiDiff(oldDoc: Record<string, any>, mergedDoc: Record<string, any>): ApiChange[] {
  const changes: ApiChange[] = [];

  if (JSON.stringify(oldDoc.info || null) !== JSON.stringify(mergedDoc.info || null)) {
    changes.push({ label: "Info aggiornata", detail: "La sezione info del merged arriva dal file nuovo.", group: "Metadati" });
  }

  const oldPaths = oldDoc.paths || {};
  const newPaths = mergedDoc.paths || {};
  [...new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)])].sort().forEach((path) => {
    if (!oldPaths[path] && newPaths[path]) {
      changes.push({ label: "Path aggiunta", detail: path, group: "Paths" });
    } else if (oldPaths[path] && JSON.stringify(oldPaths[path]) !== JSON.stringify(newPaths[path])) {
      changes.push({ label: "Path aggiornata", detail: path, group: "Paths" });
    }
  });

  const oldDefs = oldDoc.definitions || {};
  const newDefs = mergedDoc.definitions || {};
  Object.keys(newDefs).sort().forEach((k) => {
    if (!oldDefs[k]) changes.push({ label: "Definition aggiunta", detail: k, group: "Definitions" });
    else if (JSON.stringify(oldDefs[k]) !== JSON.stringify(newDefs[k])) changes.push({ label: "Definition aggiornata", detail: k, group: "Definitions" });
  });

  const oldTags = new Map(arr<any>(oldDoc.tags).filter((t) => t?.name).map((t) => [t.name, JSON.stringify(t)]));
  const newTags = new Map(arr<any>(mergedDoc.tags).filter((t) => t?.name).map((t) => [t.name, JSON.stringify(t)]));
  [...newTags.keys()].sort().forEach((k) => {
    if (!oldTags.has(k)) changes.push({ label: "Tag aggiunta", detail: k, group: "Tags" });
    else if (oldTags.get(k) !== newTags.get(k)) changes.push({ label: "Tag aggiornata", detail: k, group: "Tags" });
  });

  return changes;
}

function buildReport(changes: ApiChange[], oldName: string, newName: string) {
  const grouped = changes.reduce<Record<string, ApiChange[]>>((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});
  const lines = [
    "# Report differenze API",
    `Swagger base: ${oldName || "non specificato"}`,
    `Swagger aggiornato: ${newName || "non specificato"}`,
    `Totale differenze: ${changes.length}`,
    "",
  ];
  Object.keys(grouped).forEach((g) => {
    lines.push(`## ${g}`);
    grouped[g].forEach((c) => lines.push(`- ${c.label}: ${c.detail}`));
    lines.push("");
  });
  if (!changes.length) lines.push("Nessuna differenza API rilevata.");
  return lines.join("\n");
}

function alignedDiff(a: string, b: string): DiffRow[] {
  const oldLines = norm(toYaml(parseYaml(a))).trim().split("\n");
  const newLines = norm(toYaml(parseYaml(b))).trim().split("\n");
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0, j = 0, oi = 1, nj = 1;
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      rows.push({ type: "same", oldLine: oldLines[i], newLine: newLines[j], oldNumber: oi++, newNumber: nj++ });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "removed", oldLine: oldLines[i], newLine: "", oldNumber: oi++, newNumber: "" });
      i++;
    } else {
      rows.push({ type: "added", oldLine: "", newLine: newLines[j], oldNumber: "", newNumber: nj++ });
      j++;
    }
  }
  while (i < m) rows.push({ type: "removed", oldLine: oldLines[i++], newLine: "", oldNumber: oi++, newNumber: "" });
  while (j < n) rows.push({ type: "added", oldLine: "", newLine: newLines[j++], oldNumber: "", newNumber: nj++ });
  return rows;
}

function countChanges(rows: DiffRow[]) {
  return rows.reduce((acc, r) => {
    if (r.type === "added") acc.added += 1;
    if (r.type === "removed") acc.removed += 1;
    return acc;
  }, { added: 0, removed: 0 });
}

function FileDrop({
  title,
  subtitle,
  filename,
  onLoad,
  color,
  icon,
  accept = ".yaml,.yml,text/yaml,text/x-yaml",
  badgeLabel = "YAML",
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  filename: string;
  onLoad: (name: string, text: string) => void;
  color: string;
  icon: React.ReactNode;
  accept?: string;
  badgeLabel?: string;
  emptyLabel?: string;
}) {
  const [over, setOver] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    onLoad(file.name, await file.text());
  };

  return (
    <div
      className={`rounded-2xl border border-dashed p-4 transition ${over ? color : "bg-white/70"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void pick(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-xl bg-white/80 p-2 shadow-sm">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <label className="block cursor-pointer rounded-xl bg-white/60 px-3 py-2 text-sm text-muted-foreground">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0] || undefined)}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <Inbox className="h-4 w-4 shrink-0" />
            <span className="truncate">{filename || emptyLabel || `Trascina qui il file ${badgeLabel} o clicca per caricarlo`}</span>
          </div>
          <Badge variant="secondary">{badgeLabel}</Badge>
        </div>
      </label>
    </div>
  );
}

export default function SwaggerMergeUI() {
  const oldRef = useRef<HTMLDivElement | null>(null);
  const newRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [mergedText, setMergedText] = useState("");
  const [message, setMessage] = useState("Incolla, carica o trascina due YAML. In alternativa converti un JSON in YAML e usalo nel merge.");
  const [status, setStatus] = useState<Status>("idle");
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [apiChanges, setApiChanges] = useState<ApiChange[]>([]);

  const [jsonName, setJsonName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [jsonYaml, setJsonYaml] = useState("");
  const [jsonStatus, setJsonStatus] = useState<Status>("idle");
  const [jsonMessage, setJsonMessage] = useState("Incolla o carica un JSON: verrà convertito in YAML e potrai usarlo come input del merge.");
  const [jsonInfo, setJsonInfo] = useState<ConvertedDocInfo | null>(null);

  const diffRows = useMemo(() => alignedDiff(oldText, mergedText || newText), [oldText, mergedText, newText]);
  const stats = useMemo(() => countChanges(diffRows), [diffRows]);
  const report = useMemo(() => buildReport(apiChanges, oldName, newName), [apiChanges, oldName, newName]);
  const canMerge = Boolean(oldText.trim() && newText.trim());
  const convertedYamlName = useMemo(
    () => createYamlFilename(jsonName, "swagger-from-json.yaml"),
    [jsonName]
  );

  const doMerge = () => {
    try {
      setStatus("loading");
      setValidation(null);
      const result = mergeSwagger(oldText, newText);
      setMergedText(result.mergedText);
      setApiChanges(buildApiDiff(result.oldDoc, result.mergedDoc));
      setMessage("Merge completato.");
      setStatus("success");
    } catch (e) {
      setMessage(`Errore durante il merge: ${(e as Error).message}`);
      setApiChanges([]);
      setStatus("error");
    }
  };

  const doConvertJson = () => {
    try {
      setJsonStatus("loading");
      const parsed = parseJson(jsonText);
      const converted = toYaml(parsed);
      const info = describeConvertedDocument(parsed);
      setJsonYaml(converted);
      setJsonInfo(info);
      setJsonStatus("success");
      setJsonMessage("Conversione completata: YAML generato correttamente.");
    } catch (e) {
      setJsonStatus("error");
      setJsonInfo(null);
      setJsonYaml("");
      setJsonMessage(`Errore nella conversione JSON → YAML: ${(e as Error).message}`);
    }
  };

  const useConvertedYaml = (target: "old" | "new") => {
    if (!jsonYaml.trim()) return;
    const fileName = target === "old"
      ? createYamlFilename(jsonName, "swagger-base-from-json.yaml")
      : createYamlFilename(jsonName, "swagger-aggiornato-from-json.yaml");

    if (target === "old") {
      setOldName(fileName);
      setOldText(jsonYaml);
      setMessage("Lo Swagger convertito da JSON è stato caricato come file base.");
    } else {
      setNewName(fileName);
      setNewText(jsonYaml);
      setMessage("Lo Swagger convertito da JSON è stato caricato come file aggiornato.");
    }

    setStatus("success");
  };

  const doDownload = () => {
    const result = validateMerged(mergedText);
    setValidation(result);
    if (!result.valid) {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    download(mergedText, "swagger-merged.yaml", "text/yaml;charset=utf-8");
    setStatus("success");
    setMessage("File validato e scaricato correttamente.");
  };

  const sync = (source: HTMLDivElement | null, target: HTMLDivElement | null) => {
    if (!source || !target || syncing.current) return;
    syncing.current = true;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-100 p-4 text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-violet-100 px-3 py-1 text-xs font-medium text-slate-700">
              <Sparkles className="h-3.5 w-3.5" /> Swagger Merge & Diff
            </div>
            <Badge className="border-sky-200 bg-sky-100 text-sky-800">Versione 3.0</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Swagger Merge Tool 3.0</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-600">
            Unisci due Swagger 2.0, converti un input JSON in YAML per leggere rapidamente lo swagger ottenuto,
            visualizza le differenze API e scarica un report Markdown.
          </p>
        </div>

        <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-fuchsia-600" /> Nuova feature JSON → YAML</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Incolla o carica un JSON, convertilo in YAML e usalo direttamente come Swagger base o Swagger aggiornato.
                </p>
              </div>
              {jsonInfo && (
                <Badge className={`border ${jsonInfo.kind === "swagger" ? "border-emerald-200 bg-emerald-100 text-emerald-800" : jsonInfo.kind === "openapi" ? "border-violet-200 bg-violet-100 text-violet-800" : "border-slate-200 bg-slate-100 text-slate-800"}`}>
                  {jsonInfo.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <FileDrop
                  title="Input JSON"
                  subtitle="Swagger o documento JSON da convertire"
                  filename={jsonName}
                  color="border-fuchsia-300 bg-fuchsia-50/80"
                  icon={<Upload className="h-5 w-5 text-fuchsia-600" />}
                  accept=".json,application/json,text/json"
                  badgeLabel="JSON"
                  emptyLabel="Trascina qui il file JSON o clicca per caricarlo"
                  onLoad={(n, t) => {
                    setJsonName(n);
                    setJsonText(t);
                  }}
                />
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Incolla qui il JSON da convertire in YAML"
                  className="min-h-[220px] resize-y border-fuchsia-200 bg-fuchsia-50/30 font-mono text-xs"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white" disabled={!jsonText.trim()} onClick={doConvertJson}>
                    <Sparkles className="mr-2 h-4 w-4" /> Converti in YAML
                  </Button>
                  <Button variant="outline" className="rounded-2xl border-sky-200 bg-sky-50 text-sky-800" disabled={!jsonYaml.trim()} onClick={() => useConvertedYaml("old")}>
                    <FileText className="mr-2 h-4 w-4" /> Usa come base
                  </Button>
                  <Button variant="outline" className="rounded-2xl border-violet-200 bg-violet-50 text-violet-800" disabled={!jsonYaml.trim()} onClick={() => useConvertedYaml("new")}>
                    <Upload className="mr-2 h-4 w-4" /> Usa come aggiornato
                  </Button>
                  <Button variant="outline" className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800" disabled={!jsonYaml.trim()} onClick={() => download(jsonYaml, convertedYamlName, "text/yaml;charset=utf-8")}>
                    <Download className="mr-2 h-4 w-4" /> Scarica YAML
                  </Button>
                </div>

                <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {jsonStatus === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />}
                  <span>{jsonMessage}</span>
                </div>

                {jsonInfo && (
                  <div className={`rounded-2xl border p-3 text-sm ${jsonInfo.kind === "swagger" ? "border-emerald-200 bg-emerald-50" : jsonInfo.kind === "openapi" ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-slate-50"}`}>
                    {jsonInfo.detail}
                  </div>
                )}

                <Textarea
                  value={jsonYaml}
                  readOnly
                  placeholder="Qui apparirà il YAML convertito a partire dal JSON"
                  className="min-h-[220px] resize-y border-emerald-200 bg-emerald-50/30 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-sky-600" /> Swagger da aggiornare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FileDrop title="File base" subtitle="Swagger originale" filename={oldName} color="border-sky-300 bg-sky-50/80" icon={<Upload className="h-5 w-5 text-sky-600" />} onLoad={(n, t) => { setOldName(n); setOldText(t); }} />
              <Textarea value={oldText} onChange={(e) => setOldText(e.target.value)} placeholder="Incolla qui il contenuto YAML originale" className="min-h-[160px] max-h-[200px] resize-y border-sky-200 bg-sky-50/40 font-mono text-xs" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Upload className="h-5 w-5 text-violet-600" /> Swagger aggiornato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FileDrop title="File nuovo" subtitle="Swagger aggiornato" filename={newName} color="border-violet-300 bg-violet-50/80" icon={<Upload className="h-5 w-5 text-violet-600" />} onLoad={(n, t) => { setNewName(n); setNewText(t); }} />
              <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Incolla qui il contenuto YAML aggiornato" className="min-h-[160px] max-h-[200px] resize-y border-violet-200 bg-violet-50/40 font-mono text-xs" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><GitCompare className="h-5 w-5 text-emerald-600" /> Output merge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Aggiunte: {stats.added}</Badge>
                <Badge className="border-rose-200 bg-rose-100 text-rose-800">Rimosse: {stats.removed}</Badge>
                {validation?.valid && <Badge className="border-sky-200 bg-sky-100 text-sky-800">Validato</Badge>}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-2xl bg-gradient-to-r from-sky-600 to-violet-600 text-white" disabled={!canMerge || status === "loading"} onClick={doMerge}>
                  <Sparkles className="mr-2 h-4 w-4" /> Genera merge
                </Button>
                <Button variant="outline" className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800" disabled={!mergedText.trim()} onClick={doDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download merged swagger
                </Button>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {status === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />}
                <span>{message}</span>
              </div>
              {validation && <div className={`rounded-2xl border p-3 text-sm ${validation.valid ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>{validation.message}</div>}
              <Textarea value={mergedText} onChange={(e) => setMergedText(e.target.value)} placeholder="Qui apparirà il risultato del merge" className="min-h-[160px] max-h-[200px] resize-y border-emerald-200 bg-emerald-50/40 font-mono text-xs" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" /> Diff API intelligente</CardTitle>
                <Button variant="outline" className="rounded-2xl border-violet-200 bg-violet-50 text-violet-800" onClick={() => download(report, "api-diff-report.md", "text/markdown;charset=utf-8")}>
                  <FileDown className="mr-2 h-4 w-4" /> Scarica report API
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiChanges.length ? (
                <div className="space-y-2">
                  {apiChanges.map((c, i) => (
                    <div key={i} className="rounded-2xl border bg-slate-50 p-3">
                      <div className="font-medium">{c.label}</div>
                      <div className="text-sm text-slate-600">{c.detail}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{c.group}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Dopo il merge qui compariranno le modifiche logiche: path, definitions, tags e metadati.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileDown className="h-5 w-5 text-sky-600" /> Report differenze API</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={report} readOnly className="min-h-[300px] border-sky-200 bg-sky-50/30 font-mono text-xs" />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-0 bg-white/85 shadow-lg">
          <CardHeader>
            <CardTitle>Diff YAML riga per riga allineato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Questo diff usa YAML normalizzati e allineamento delle righe, quindi riduce i falsi positivi dovuti a spostamenti o riformattazione.
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="border-r border-slate-200">
                  <div className="bg-gradient-to-r from-rose-50 to-white px-4 py-3 text-sm font-medium text-slate-700">File originale</div>
                  <div ref={oldRef} onScroll={() => sync(oldRef.current, newRef.current)} className="max-h-[260px] overflow-auto font-mono text-xs">
                    {diffRows.map((r, i) => (
                      <div key={`o-${i}`} className={`flex gap-2 px-3 py-1 whitespace-pre-wrap ${r.type === "removed" ? "bg-rose-50" : "bg-background"}`}>
                        <span className="w-10 text-muted-foreground">{r.oldNumber || ""}</span>
                        <span className="w-4 text-muted-foreground">{r.type === "removed" ? "-" : " "}</span>
                        <span className="flex-1">{r.oldLine || " "}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="bg-gradient-to-r from-emerald-50 to-white px-4 py-3 text-sm font-medium text-slate-700">File merged</div>
                  <div ref={newRef} onScroll={() => sync(newRef.current, oldRef.current)} className="max-h-[260px] overflow-auto font-mono text-xs">
                    {diffRows.map((r, i) => (
                      <div key={`n-${i}`} className={`flex gap-2 px-3 py-1 whitespace-pre-wrap ${r.type === "added" ? "bg-emerald-50" : "bg-background"}`}>
                        <span className="w-10 text-muted-foreground">{r.newNumber || ""}</span>
                        <span className="w-4 text-muted-foreground">{r.type === "added" ? "+" : " "}</span>
                        <span className="flex-1">{r.newLine || " "}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Confronto tra le versioni YAML dopo normalizzazione strutturale. Se cambia l'ordine di blocchi grandi, possono comunque apparire diverse differenze.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
