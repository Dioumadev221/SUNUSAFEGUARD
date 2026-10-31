import { Check, EyeOff, HardDrive, Handshake, PhoneOff, ShieldCheck, X } from "lucide-react";

const ITEMS = [
  { icon: EyeOff, title: "Vos messages restent chez vous", text: "Ils ne sont pas enregistrés sur nos serveurs. L'historique reste dans l'onglet et disparaît quand vous le fermez, l'effacez ou utilisez « Sortir »." },
  { icon: ShieldCheck, title: "Des statistiques anonymes", text: "Nous comptons seulement des informations générales (langue, type de besoin), sans texte ni identifiant. Les petits chiffres ne sont jamais publiés." },
  { icon: Handshake, title: "Contact uniquement avec votre accord", text: "Une structure ne reçoit vos coordonnées que si vous cochez la case de consentement. Elles sont chiffrées puis effacées." },
  { icon: PhoneOff, title: "Aucun signalement automatique", text: "Sunu ne prévient jamais la police, votre famille ou un tiers à votre place." },
  { icon: HardDrive, title: "Pensez à votre téléphone", text: "Si quelqu'un peut le consulter, utilisez la navigation privée et le bouton « Sortir » (ou Échap deux fois)." },
];

const CAN = ["Vous informer sur le bien-être, vos droits, la santé", "Vous indiquer des structures adaptées", "Vous écouter sans jugement"];
const CANNOT = ["Poser un diagnostic ou prescrire", "Remplacer un médecin, un psychologue ou un juriste", "Prévenir quelqu'un à votre place"];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <div className="text-center">
        <p className="eyebrow">Confidentialité</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl sm:text-6xl">Votre sécurité passe <em className="scribble font-medium text-teal dark:text-teal-light">avant tout</em>.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg muted">Ce que nous faisons — et surtout ce que nous ne faisons jamais — avec ce que vous écrivez.</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={`card flex gap-4 p-6 ${i === 0 ? "sm:col-span-2" : ""}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night text-ochre-light dark:bg-sand-100 dark:text-ochre-dark"><Icon size={20} /></span>
            <div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-1.5 leading-relaxed muted">{text}</p></div>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-teal-soft p-6 text-teal-dark dark:bg-teal/10 dark:text-teal-light">
          <h2 className="font-display text-2xl font-semibold">L'assistant peut</h2>
          <ul className="mt-4 space-y-3">{CAN.map((x) => <li key={x} className="flex gap-2.5 text-night dark:text-slate-100"><Check size={19} className="mt-0.5 shrink-0 text-teal dark:text-teal-light" /> {x}</li>)}</ul>
        </div>
        <div className="rounded-[1.75rem] border border-sand-300 p-6 dark:border-white/10">
          <h2 className="font-display text-2xl font-semibold">L'assistant ne peut pas</h2>
          <ul className="mt-4 space-y-3">{CANNOT.map((x) => <li key={x} className="flex gap-2.5"><X size={19} className="mt-0.5 shrink-0 text-slate-400" /> {x}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
