export default function Privacy() {
  const items = [
    ["Vos messages", "Les messages envoyés à l'assistant ne sont pas enregistrés sur nos serveurs. L'historique reste uniquement dans l'onglet de votre navigateur et disparaît quand vous le fermez, l'effacez ou utilisez la Sortie rapide."],
    ["Statistiques anonymes", "Pour améliorer le service, nous comptons seulement des informations générales (langue, type de besoin, région si vous l'indiquez), sans aucun texte ni identifiant. Les chiffres trop petits ne sont jamais publiés."],
    ["Mise en relation", "Une structure ne reçoit vos coordonnées que si vous cochez la case de consentement. Ces informations sont chiffrées et effacées à la clôture de la demande."],
    ["Aucun signalement automatique", "La plateforme ne prévient jamais la police, votre famille ou un tiers à votre place."],
    ["Votre téléphone", "Nous ne pouvons pas garantir la confidentialité de votre appareil lui-même. Si quelqu'un peut le consulter, utilisez une navigation privée et la Sortie rapide (ou Échap deux fois)."],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Confidentialité et sécurité</h1>
      {items.map(([title, text]) => (
        <section key={title} className="card">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm muted">{text}</p>
        </section>
      ))}
    </div>
  );
}
