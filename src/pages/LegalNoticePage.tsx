import React from 'react';
import { Link } from 'react-router-dom';

export const LegalNoticePage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
        <h1 className="text-3xl font-black text-primary-dark">Mentions légales</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Éditeur du site</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le site Calc Rush (www.calc-rush.fr) est édité par Timothée Demares, entrepreneur
            individuel.
          </p>
          <ul className="text-slate-600 text-sm leading-relaxed list-none space-y-1">
            <li>SIRET : 930 571 476 00017</li>
            <li>Adresse : 40 cours Henri Brunet, 33300 Bordeaux, France</li>
            <li>Email : timothee.demares@gmail.com</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Hébergement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723,
            États-Unis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'ensemble des contenus présents sur Calc Rush (textes, graphismes, logo) est protégé
            par le droit d'auteur. Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour toute question relative au site, vous pouvez nous contacter à l'adresse :
            timothee.demares@gmail.com.
          </p>
        </section>
      </div>

      <div className="text-center pb-8">
        <Link
          to="/"
          className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};
