import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
        <h1 className="text-3xl font-black text-primary-dark">Conditions d'utilisation</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Objet</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Calc Rush est un jeu multijoueur d'entraînement au calcul mental. Le service est
            accessible avec ou sans compte : jouer reste gratuit dans tous les cas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Accès et âge</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le service est ouvert à tous. La création d'un compte par un utilisateur de moins de 15
            ans suppose l'accord préalable d'un parent ou d'un tuteur légal (voir notre{' '}
            <Link to="/privacy-policy" className="font-bold text-primary hover:underline">
              politique de confidentialité
            </Link>
            ).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Compte utilisateur</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Un compte est identifié par une adresse email et un pseudo. Vous êtes responsable de la
            confidentialité de vos identifiants. Vous pouvez demander la suppression de votre compte
            à tout moment en nous contactant à l'adresse timothee.demares@gmail.com.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Comportement attendu</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Votre pseudo et vos contenus ne doivent pas être injurieux, offensants, ou usurper
            l'identité d'un tiers. Nous nous réservons le droit de suspendre un compte en cas
            d'abus.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le jeu, sa marque et ses graphismes sont protégés par le droit d'auteur (voir nos{' '}
            <Link to="/legal-notice" className="font-bold text-primary hover:underline">
              mentions légales
            </Link>
            ). Votre pseudo et vos scores restent les vôtres, mais peuvent être affichés
            publiquement dans les classements du jeu.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Disponibilité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le service est fourni en l'état, sans garantie de disponibilité continue (maintenance,
            incidents techniques).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Responsabilité</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Calc Rush est un outil éducatif et ludique, sans garantie de résultat pédagogique. Nous
            ne saurions être tenus responsables d'un usage détourné du service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Résiliation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vous pouvez supprimer votre compte à tout moment. Nous pouvons résilier un compte en cas
            de manquement grave aux présentes conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Droit applicable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les présentes conditions sont soumises au droit français. Tout litige relève des
            tribunaux compétents du ressort de l'éditeur.
          </p>
        </section>
      </div>
    </div>
  );
};
