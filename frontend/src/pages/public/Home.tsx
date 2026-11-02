import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Clock, EyeOff, HeartHandshake, House, Lock, type LucideIcon,
  Phone, PhoneOff, Scale, ShieldAlert, Smartphone, Stethoscope, UserRoundX,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { usePrefs, type Tx } from "@/lib/prefs";
import { api } from "@/lib/api";
import type { Organization } from "@/lib/types";
import EmergencyPanel from "@/components/EmergencyPanel";

const step3WithCallback = (tx: Tx) => tx(
  "Centres d'écoute, juristes, structures de santé près de chez vous. Vous appelez, ou vous demandez à être rappelée : c'est vous qui décidez.",
  "Listening centres, lawyers, health services near you. You call them, or ask to be called back: you decide.");

/** Le rappel n'est promis sur l'accueil que si au moins une structure de l'annuaire peut le recevoir. */
function useCallbackAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    api<Organization[]>("/directory").then((orgs) => setAvailable(orgs.some((o) => o.accepts_referrals))).catch(() => setAvailable(false));
  }, []);
  return available;
}

// Photos libres (Pexels), recadrées 800 × 600 et allégées : voir public/illustrations/CREDITS.md.
// « ask » pré-remplit le chat : il reste en français, langue de l'assistant (avec le wolof).
const topics = (tx: Tx): { icon: LucideIcon; title: string; ask: string; img: string; focus: string }[] => [
  { icon: HeartHandshake, title: tx("Moral et bien-être", "Mood and well-being"), ask: "Je me sens triste et angoissée", img: "moral", focus: "object-[30%_30%]" },
  { icon: ShieldAlert, title: tx("Violences à la maison", "Violence at home"), ask: "Mon mari me frappe, est-ce que je peux porter plainte ?", img: "violences", focus: "object-[50%_30%]" },
  { icon: Scale, title: tx("Droits et justice", "Rights and justice"), ask: "Mon mari garde tout mon salaire. Est-ce que c'est normal ?", img: "droits", focus: "object-[60%_30%]" },
  { icon: Stethoscope, title: tx("Santé et corps", "Health and body"), ask: "Où trouver un suivi de santé reproductive confidentiel ?", img: "sante", focus: "object-[50%_20%]" },
  { icon: House, title: tx("Un endroit sûr", "A safe place"), ask: "Je dois quitter la maison, où puis-je être hébergée ?", img: "abri", focus: "object-center" },
  { icon: Smartphone, title: tx("Harcèlement en ligne", "Online harassment"), ask: "Quelqu'un menace de publier mes photos", img: "numerique", focus: "object-[60%_40%]" },
];

const steps = (tx: Tx): { title: string; text: string; demo: ReactNode }[] => [
  {
    title: tx("Vous écrivez, comme à une amie", "You write, as you would to a friend"),
    text: tx("Avec vos propres mots. Pas de compte à créer, pas de nom à donner.", "In your own words. No account to create, no name to give."),
    demo: (
      <div className="flex justify-end">
        <p className="max-w-[88%] rounded-3xl rounded-br-md bg-night px-4 py-2.5 text-sm text-sand-100 dark:bg-teal-light dark:text-night-950">
          Mon mari garde tout mon salaire. Est-ce normal ?
        </p>
      </div>
    ),
  },
  {
    title: tx("Sunu répond avec des informations vérifiées", "Sunu answers with verified information"),
    text: tx("Chaque réponse s'appuie sur des documents relus par des juristes, des psychologues et des soignants. La source est indiquée.",
      "Each answer is based on documents reviewed by lawyers, psychologists and health workers. The source is shown."),
    demo: (
      <div className="flex items-start gap-2">
        <LogoMark size={28} className="shrink-0" />
        <div className="rounded-3xl rounded-tl-md bg-white px-4 py-2.5 text-sm shadow-soft dark:bg-white/[0.06] dark:shadow-none">
          <p>Ce que vous décrivez peut être une violence économique. Vous avez des droits…</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-xs font-bold text-teal-dark dark:bg-teal/15 dark:text-teal-light"><BadgeCheck size={13} /> {tx("Source vérifiée", "Verified source")}</p>
        </div>
      </div>
    ),
  },
  {
    title: tx("Vous êtes orientée vers des personnes réelles", "You are referred to real people"),
    text: tx("Centres d'écoute, juristes, structures de santé près de chez vous. Vous les appelez directement, quand vous le souhaitez : c'est vous qui décidez.",
      "Listening centres, lawyers, health services near you. You call them directly, whenever you want: you decide."),
    demo: (
      <div className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-soft dark:bg-white/[0.06] dark:shadow-none">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#DDE5F3] text-[#24427A] dark:bg-[#24427A]/30 dark:text-[#B7C9EE]"><Scale size={18} /></span>
        <span className="min-w-0 flex-1 text-sm"><span className="block font-bold">{tx("Maison de justice", "Justice centre")}</span><span className="muted">Kaolack · {tx("Disponible", "Available")}</span></span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal text-white dark:bg-teal-light dark:text-night-950"><Phone size={15} /></span>
      </div>
    ),
  },
];

const network = (tx: Tx): { icon: LucideIcon; title: string; text: string }[] => [
  { icon: HeartHandshake, title: tx("Centres d'écoute", "Listening centres"), text: tx("Des psychologues et des conseillères pour parler en confiance.", "Psychologists and counsellors you can talk to in confidence.") },
  { icon: Scale, title: tx("Juristes et maisons de justice", "Lawyers and justice centres"), text: tx("Comprendre vos droits et être accompagnée dans les démarches.", "Understand your rights and get support with the procedures.") },
  { icon: Stethoscope, title: tx("Structures de santé", "Health services"), text: tx("Soins, santé reproductive, certificat médical après des violences.", "Care, reproductive health, medical certificate after violence.") },
  { icon: House, title: tx("Hébergement d'urgence", "Emergency shelter"), text: tx("Un endroit sûr pour vous mettre à l'abri, avec vos enfants.", "A safe place to shelter, with your children.") },
];

const promises = (tx: Tx): { icon: LucideIcon; title: string; text: string }[] => [
  { icon: EyeOff, title: tx("Rien n'est enregistré", "Nothing is stored"), text: tx("Vos messages ne sont pas conservés sur nos serveurs. Ils disparaissent quand vous fermez l'onglet.", "Your messages are not kept on our servers. They disappear when you close the tab.") },
  { icon: PhoneOff, title: tx("Personne n'est prévenu à votre place", "No one is alerted on your behalf"), text: tx("Ni la police, ni votre famille. Une structure ne vous contacte que si vous l'avez demandé.", "Not the police, not your family. An organization only contacts you if you asked it to.") },
  { icon: UserRoundX, title: tx("Aucun nom, aucun compte", "No name, no account"), text: tx("Vous restez anonyme du début à la fin. Le bouton « Sortir » efface tout en un geste.", "You stay anonymous from start to finish. The \"Exit\" button erases everything in one tap.") },
];

function HeroTitle() {
  const { lang } = usePrefs();
  return lang === "en" ? (
    <>
      Speak in confidence.
      <br />
      Find <em className="scribble font-medium text-teal dark:text-teal-light">help</em>.
    </>
  ) : (
    <>
      Parlez en confiance.
      <br />
      Trouvez de <em className="scribble font-medium text-teal dark:text-teal-light">l'aide</em>.
    </>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[30rem] lg:mr-0" aria-hidden>
      <div className="absolute -right-6 -top-6 h-[78%] w-[78%] rounded-full bg-ochre-light/70 dark:bg-ochre/25" />
      <div className="absolute -left-4 bottom-10 h-24 w-24 rounded-full border-[10px] border-teal/20" />
      <div className="arch relative aspect-[4/5] overflow-hidden shadow-lift">
        <img src="/illustrations/hero.jpg" alt="" className="h-full w-full animate-kenburns object-cover object-[50%_40%] motion-reduce:animate-none dark:brightness-[.8]" />
      </div>
    </div>
  );
}

export default function Home() {
  const { t, tx } = usePrefs();
  const callback = useCallbackAvailable();
  return (
    <div className="space-y-24 sm:space-y-32">
      <section className="grid items-center gap-14 pt-10 sm:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        <div className="animate-rise motion-reduce:animate-none">
          <span className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            <Lock size={12} className="text-teal dark:text-teal-light" /> {tx("Gratuit · Confidentiel · Sans inscription", "Free · Confidential · No sign-up")}
          </span>
          <h1 className="mt-6 text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem]"><HeroTitle /></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{t("heroText")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/chat" className="btn-primary h-14 w-full px-7 text-base sm:w-auto">{t("startChat")} <ArrowRight size={18} /></Link>
            <Link to="/aide" className="btn-outline h-14 w-full px-7 text-base sm:w-auto">{t("findHelp")}</Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><Clock size={17} className="text-ochre" /> {tx("Disponible jour et nuit", "Available day and night")}</li>
            <li className="flex items-center gap-2"><UserRoundX size={17} className="text-ochre" /> {tx("Aucun nom demandé", "No name required")}</li>
            <li className="flex items-center gap-2"><BadgeCheck size={17} className="text-ochre" /> {tx("Réponses sourcées", "Sourced answers")}</li>
          </ul>
        </div>
        <HeroVisual />
      </section>

      <section>
        <div>
          <p className="eyebrow">{tx("Vous pouvez tout dire", "You can say anything")}</p>
          <h2 className="mt-3 text-4xl sm:whitespace-nowrap sm:text-5xl">{tx("De quoi voulez-vous parler\u00a0?", "What would you like to talk about?")}</h2>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics(tx).map(({ icon: Icon, title, ask, img, focus }) => (
            <li key={title}>
              <Link to={`/chat?q=${encodeURIComponent(ask)}`} className="group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-night p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift sm:p-6 dark:shadow-none">
                <img src={`/illustrations/sujets/${img}.jpg`} alt="" loading="lazy" className={`absolute inset-0 -z-10 h-full w-full object-cover ${focus} transition duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 dark:brightness-[.75]`} />
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/45 to-transparent" aria-hidden />
                <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-night" aria-hidden>
                  <ArrowUpRight size={18} />
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur"><Icon size={20} strokeWidth={1.8} /></span>
                <span className="mt-3 font-display text-2xl font-semibold text-white">{title}</span>
                <span className="mt-1 text-sm leading-relaxed text-white/85">« {ask} »</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{tx("Comment ça marche", "How it works")}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{tx("Trois étapes, à votre rythme", "Three steps, at your own pace")}</h2>
        </div>
        <ol className="relative mt-14 grid gap-6 lg:grid-cols-3">
          <span className="absolute left-0 right-0 top-9 hidden border-t-2 border-dashed border-night/10 lg:block dark:border-white/10" aria-hidden />
          {steps(tx).map(({ title, text, demo }, i) => (
            <li key={title} className="relative flex flex-col rounded-[1.75rem] bg-sand-200/50 p-6 dark:bg-white/[0.03]">
              <span className="grid h-[4.5rem] w-[4.5rem] -translate-y-12 place-items-center self-start rounded-full border-4 border-sand bg-night font-display text-3xl font-semibold italic text-ochre-light dark:border-night-950 dark:bg-sand-100 dark:text-ochre-dark">{i + 1}</span>
              <h3 className="-mt-8 font-display text-2xl font-semibold leading-snug">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed muted">{i === 2 && callback ? step3WithCallback(tx) : text}</p>
              <div className="mt-6 flex-1 content-end" aria-hidden>{demo}</div>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Link to="/chat" className="btn-ink h-14 px-7 text-base">{tx("Essayer maintenant", "Try it now")} <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section className="relative mx-[calc(50%-50vw)] overflow-hidden bg-night text-sand-100 dark:bg-night-900">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-ochre/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-ochre-light"><span className="h-px w-6 bg-ochre" /> {tx("Réseau d'aide", "Support network")}</p>
            <h2 className="mt-4 text-4xl leading-tight text-sand-100 sm:text-5xl">{tx("Derrière chaque réponse, des ", "Behind every answer, ")}<em className="font-medium text-ochre-light">{tx("personnes", "people")}</em>{tx(" prêtes à vous recevoir.", " ready to welcome you.")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-sand-100/70">{callback
              ? tx("Appelez-les directement, ou demandez à être recontactée — seulement si vous le souhaitez. Rien n'est transmis sans votre accord.",
                "Call them directly, or ask to be contacted — only if you want to. Nothing is shared without your consent.")
              : tx("Appelez-les directement, quand vous le souhaitez. Vous restez libre de vos choix, à chaque étape.",
                "Call them directly, whenever you want. You stay free to choose, at every step.")}</p>
            <Link to="/aide" className="btn mt-8 h-14 bg-ochre-light px-7 text-base text-night hover:-translate-y-px hover:bg-sun">{tx("Voir les structures", "See the organizations")} <ArrowRight size={18} /></Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {network(tx).map(({ icon: Icon, title, text }, i) => (
              <li key={title} className={`rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.07] ${i % 2 ? "sm:translate-y-8" : ""}`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-100 text-night"><Icon size={22} strokeWidth={1.8} /></span>
                <h3 className="mt-5 font-display text-xl font-semibold text-sand-100">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-sand-100/65">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="eyebrow">{tx("Notre promesse", "Our promise")}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{tx("Votre sécurité passe avant tout.", "Your safety comes first.")}</h2>
          <Link to="/confidentialite" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal underline-offset-4 hover:underline dark:text-teal-light">{tx("Comment nous protégeons vos données", "How we protect your data")} <ArrowRight size={16} /></Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {promises(tx).map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-[1.75rem] border border-sand-200 bg-white/70 p-5 dark:border-white/[0.06] dark:bg-night-850">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-night text-ochre-light dark:bg-sand-100 dark:text-ochre-dark"><Icon size={19} /></span>
              <h3 className="mt-4 font-bold leading-snug">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <EmergencyPanel note={tx("Appel gratuit, 24 h/24.", "Free calls, 24/7.")} />
    </div>
  );
}
