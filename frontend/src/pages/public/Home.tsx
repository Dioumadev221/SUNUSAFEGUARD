import { Link } from "react-router-dom";
import { BookOpenCheck, Check, HeartHandshake, Lock, MessageCircle, Mic, X } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import EmergencyPanel from "@/components/EmergencyPanel";

export default function Home() {
  const { t } = usePrefs();
  return (
    <div className="space-y-10">
      <section className="pt-4">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-4 max-w-2xl text-lg muted">{t("heroText")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/chat" className="btn-primary text-base"><MessageCircle size={18} /> {t("startChat")}</Link>
          <Link to="/aide" className="btn-ghost text-base"><HeartHandshake size={18} /> {t("findHelp")}</Link>
          <button disabled className="btn-ghost text-base" title="Bientôt disponible (Phase 4)"><Mic size={18} /> Voix — bientôt</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: MessageCircle, title: "Un assistant d'information", text: "En français, et progressivement en wolof. Réponses fondées sur des documents vérifiés, avec leurs sources." },
          { icon: HeartHandshake, title: "Une orientation humaine", text: "Un annuaire de structures d'écoute, juridiques, de santé et d'hébergement, avec leurs horaires." },
          { icon: Lock, title: "Discret par conception", text: "Vos messages ne sont pas enregistrés sur nos serveurs. Bouton Sortie rapide sur chaque page." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card">
            <Icon className="mb-3 text-teal-light" aria-hidden />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BookOpenCheck className="text-teal-light" /> {t("limitsTitle")}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ul className="space-y-2 text-sm">
            {["Vous informer sur le bien-être, vos droits, la santé", "Vous indiquer des structures d'aide adaptées", "Vous écouter sans jugement", "Citer les documents utilisés"].map((x) => (
              <li key={x} className="flex gap-2"><Check size={18} className="shrink-0 text-success" /> {x}</li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            {["Poser un diagnostic ou prescrire un traitement", "Remplacer un médecin, un psychologue ou un juriste", "Prévenir la police ou un tiers à votre place", "Garantir une confidentialité absolue de votre téléphone"].map((x) => (
              <li key={x} className="flex gap-2"><X size={18} className="shrink-0 text-alert" /> {x}</li>
            ))}
          </ul>
        </div>
      </section>

      <EmergencyPanel />
    </div>
  );
}
