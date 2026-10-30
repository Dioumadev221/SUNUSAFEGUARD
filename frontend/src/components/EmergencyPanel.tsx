import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

type Contact = { label: string; number: string };

export default function EmergencyPanel() {
  const { t } = usePrefs();
  const [contacts, setContacts] = useState<Contact[]>([]);
  useEffect(() => {
    api<Contact[]>("/emergency-contacts").then(setContacts).catch(() => setContacts([]));
  }, []);
  return (
    <div role="alert" className="rounded-2xl border border-alert/40 bg-alert/10 p-4">
      <p className="mb-3 font-semibold text-alert">{t("emergencyTitle")}</p>
      <div className="flex flex-wrap gap-2">
        {contacts.map((c) => (
          <a key={c.number} href={`tel:${c.number}`} className="btn bg-alert text-white hover:bg-alert/90">
            <Phone size={16} aria-hidden /> {c.label} · {c.number}
          </a>
        ))}
      </div>
    </div>
  );
}
