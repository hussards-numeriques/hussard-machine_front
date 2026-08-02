import React from 'react';

export const TermsOfSalePage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
        <h1 className="text-3xl font-black text-primary-dark">Conditions générales de vente</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Objet</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les présentes conditions régissent la vente d'un abonnement de soutien optionnel (1, 3
            ou 12 mois), en paiement unique et sans reconduction automatique. Cet abonnement ne
            donne aucun avantage de jeu : XP, niveau, grade et streak restent identiques pour tous
            les joueurs, avec ou sans abonnement. Il débloque uniquement la progression cosmétique
            des quêtes et titres, ainsi qu'un badge de soutien visible dans le jeu.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Souscripteur</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'achat est réalisé par le titulaire du moyen de paiement utilisé. Si le compte
            bénéficiaire appartient à un mineur, l'achat doit être effectué par un parent ou le
            titulaire de l'autorité parentale sur ce mineur.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Prix</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les prix affichés sur la page{' '}
            <a href="/subscription" className="font-bold text-primary hover:underline">
              /subscription
            </a>{' '}
            sont en euros, toutes taxes comprises, sans frais cachés.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Modalités de paiement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le paiement est traité par Stripe, via une page de paiement sécurisée hébergée par
            Stripe (Stripe Checkout). Calc Rush ne stocke ni ne voit jamais vos données de carte
            bancaire.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Absence de reconduction</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'abonnement s'arrête automatiquement à la fin de la période choisie. Aucun prélèvement
            ultérieur n'est effectué.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Droit de rétractation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Conformément à l'article L221-18 du Code de la consommation, vous disposez en principe
            d'un délai de rétractation de 14 jours pour tout achat à distance. Ce service étant à
            exécution immédiate (déblocage instantané de la progression), vous renoncez expressément
            à ce délai en cochant la case de confirmation prévue à cet effet avant l'achat.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Remboursement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Aucun remboursement n'est possible une fois le service exécuté, du fait de la
            renonciation ci-dessus, sauf dysfonctionnement technique imputable à l'éditeur vous
            empêchant d'accéder au service pendant la période payée : un remboursement au prorata
            pourra alors être accordé sur demande.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Réclamation et médiation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour toute réclamation, contactez-nous d'abord à l'adresse timothee.demares@gmail.com. À
            défaut d'accord amiable, vous pouvez recourir à la plateforme européenne de règlement en
            ligne des litiges, accessible à l'adresse{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Droit applicable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les présentes conditions générales de vente sont soumises au droit français.
          </p>
        </section>
      </div>
    </div>
  );
};
