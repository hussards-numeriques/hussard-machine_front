import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
        <h1 className="text-3xl font-black text-primary-dark">Politique de confidentialité</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Responsable du traitement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Timothée Demares, entrepreneur individuel, 40 cours Henri Brunet, 33300 Bordeaux, est
            responsable du traitement des données collectées sur Calc Rush.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Données collectées</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vous pouvez jouer sans créer de compte. Si vous créez un compte, nous collectons
            uniquement votre adresse email, votre pseudo, et vos scores de jeu (XP, niveau, grade,
            historique de parties).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Finalité du traitement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Ces données servent uniquement à faire fonctionner votre compte : authentification,
            sauvegarde de votre progression et affichage de votre historique de parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Stockage et sécurité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Lors de votre connexion, un jeton d'authentification est stocké dans le stockage local
            (localStorage) de votre navigateur afin de maintenir votre session. Ce jeton n'est
            jamais transmis à un tiers et est supprimé lors de la déconnexion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Cookies et traceurs</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Calc Rush n'utilise aucun cookie ni traceur publicitaire ou analytique. Aucun
            consentement de ce type n'est donc requis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Durée de conservation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vos données sont conservées tant que votre compte est actif. Vous pouvez demander leur
            suppression à tout moment en nous contactant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Vos droits</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement
            et de portabilité de vos données. Pour exercer ces droits, contactez-nous à l'adresse :
            timothee.demares@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
};
