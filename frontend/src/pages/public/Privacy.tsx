import { Check, EyeOff, HardDrive, Handshake, PhoneOff, ShieldCheck, X } from "lucide-react";
import { usePrefs, type Tx } from "@/lib/prefs";

const items = (tx: Tx) => [
  { icon: EyeOff, title: tx("Vos messages restent chez vous", "Your messages stay with you"), text: tx("Ils ne sont pas enregistrés sur nos serveurs. L'historique reste dans l'onglet et disparaît quand vous le fermez, l'effacez ou utilisez « Sortir ».", "They are not stored on our servers. The history stays in the tab and disappears when you close it, clear it or use \"Exit\".") },
  { icon: ShieldCheck, title: tx("Des statistiques anonymes", "Anonymous statistics"), text: tx("Nous comptons seulement des informations générales (langue, type de besoin), sans texte ni identifiant. Les petits chiffres ne sont jamais publiés.", "We only count general information (language, type of need), with no text and no identifier. Small numbers are never published.") },
  { icon: Handshake, title: tx("Contact uniquement avec votre accord", "Contact only with your consent"), text: tx("Une structure ne reçoit vos coordonnées que si vous cochez la case de consentement. Elles sont chiffrées puis effacées.", "An organization only receives your contact details if you tick the consent box. They are encrypted, then deleted.") },
  { icon: PhoneOff, title: tx("Aucun signalement automatique", "No automatic reporting"), text: tx("Sunu ne prévient jamais la police, votre famille ou un tiers à votre place.", "Sunu never alerts the police, your family or anyone else on your behalf.") },
  { icon: HardDrive, title: tx("Pensez à votre téléphone", "Think about your phone"), text: tx("Si quelqu'un peut le consulter, utilisez la navigation privée et le bouton « Sortir » (ou Échap deux fois).", "If someone can look at it, use private browsing and the \"Exit\" button (or press Esc twice).") },
];

const can = (tx: Tx) => [tx("Vous informer sur le bien-être, vos droits, la santé", "Inform you about well-being, your rights, health"), tx("Vous indiquer des structures adaptées", "Point you to suitable organizations"), tx("Vous écouter sans jugement", "Listen to you without judgement")];
const cannot = (tx: Tx) => [tx("Poser un diagnostic ou prescrire", "Make a diagnosis or prescribe"), tx("Remplacer un médecin, un psychologue ou un juriste", "Replace a doctor, a psychologist or a lawyer"), tx("Prévenir quelqu'un à votre place", "Alert someone on your behalf")];

export default function Privacy() {
  const { t, tx } = usePrefs();
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <div className="text-center">
        <p className="eyebrow">{t("navPrivacy")}</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl sm:text-6xl">{tx("Votre sécurité passe ", "Your safety comes ")}<em className="scribble font-medium text-teal dark:text-teal-light">{tx("avant tout", "first")}</em>.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg muted">{tx("Ce que nous faisons — et surtout ce que nous ne faisons jamais — avec ce que vous écrivez.", "What we do — and above all what we never do — with what you write.")}</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">
        {items(tx).map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={`card flex gap-4 p-6 ${i === 0 ? "sm:col-span-2" : ""}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night text-ochre-light dark:bg-sand-100 dark:text-ochre-dark"><Icon size={20} /></span>
            <div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-1.5 leading-relaxed muted">{text}</p></div>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-teal-soft p-6 text-teal-dark dark:bg-teal/10 dark:text-teal-light">
          <h2 className="font-display text-2xl font-semibold">{tx("L'assistant peut", "The assistant can")}</h2>
          <ul className="mt-4 space-y-3">{can(tx).map((x) => <li key={x} className="flex gap-2.5 text-night dark:text-slate-100"><Check size={19} className="mt-0.5 shrink-0 text-teal dark:text-teal-light" /> {x}</li>)}</ul>
        </div>
        <div className="rounded-[1.75rem] border border-sand-300 p-6 dark:border-white/10">
          <h2 className="font-display text-2xl font-semibold">{tx("L'assistant ne peut pas", "The assistant cannot")}</h2>
          <ul className="mt-4 space-y-3">{cannot(tx).map((x) => <li key={x} className="flex gap-2.5"><X size={19} className="mt-0.5 shrink-0 text-slate-400" /> {x}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
