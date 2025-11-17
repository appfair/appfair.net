
export const languages = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const defaultLang = 'en';

export const ui = {
    'nav.home': {
        'en': 'Home',
        'fr': 'Accueil',
        'es': 'Inicio',
    },
    'nav.about': {
        'en': 'About',
        'fr': 'À propos',
        'es': 'Acerca de',
    },
    'footer.rights': {
        'en': 'All rights reserved',
        'fr': 'Tous droits réservés',
        'es': 'Todos los derechos reservados',
    },
    'language.select': {
        'en': 'Select language',
        'fr': 'Choisir la langue',
        'es': 'Seleccionar idioma',
    }
};

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[key][lang] || ui[key][defaultLang];
  }
}
