import { Count } from "./ui";

/** Carte schématique des 14 régions (tuiles positionnées approximativement, pas à l'échelle).
 *  Évite de charger un fond cartographique externe ; une carte PostGIS fine pourra la remplacer. */
const TILES: Record<string, [number, number]> = {
  "Saint-Louis": [2, 0], Louga: [2, 1], Matam: [3, 1], Dakar: [0, 2], Thiès: [1, 2], Diourbel: [2, 2],
  Fatick: [1, 3], Kaolack: [2, 3], Kaffrine: [3, 3], Tambacounda: [4, 3],
  Ziguinchor: [1, 5], Sédhiou: [2, 5], Kolda: [3, 5], Kédougou: [4, 5],
};

type Region = { region: string; count: number | null; wolof_share: number | null };

export default function RegionMap({ data, metric }: { data: Region[]; metric: "count" | "wolof" }) {
  const byName = Object.fromEntries(data.map((r) => [r.region, r]));
  const max = Math.max(1, ...data.map((r) => r.count ?? 0));
  const value = (r?: Region) => (metric === "count" ? (r?.count ?? null) !== null ? (r!.count as number) / max : null : r?.wolof_share ?? null);

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5" style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}>
        {Object.entries(TILES).map(([name, [col, row]]) => {
          const r = byName[name];
          const v = value(r);
          return (
            <div
              key={name}
              style={{ gridColumn: col + 1, gridRow: row + 1, backgroundColor: v === null ? undefined : `rgba(20,184,166,${0.15 + 0.85 * v})` }}
              className={`flex aspect-[4/3] flex-col justify-between rounded-lg p-1.5 text-[11px] leading-tight ${v === null ? "bg-sand-200 dark:bg-night-700" : v > 0.45 ? "text-night" : "text-night dark:text-sand"}`}
              title={v === null ? `${name} : effectif masqué ou nul` : name}
            >
              <span className="font-semibold">{name}</span>
              <span>{metric === "count" ? <Count value={r?.count ?? null} /> : r?.wolof_share == null ? "—" : `${Math.round(r.wolof_share * 100)} % wo`}</span>
            </div>
          );
        })}
        <div style={{ gridColumn: "1 / 6", gridRow: 5 }} className="flex items-center justify-center text-[10px] muted">— Gambie —</div>
      </div>
      <p className="mt-2 text-xs muted">Schéma de position des régions, non à l'échelle. Teinte proportionnelle {metric === "count" ? "au volume" : "à la part du wolof"} ; gris = masqué (&lt; 5) ou sans donnée.</p>
    </div>
  );
}
