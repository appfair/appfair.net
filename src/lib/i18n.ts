
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
    'footer.links': {
        'en': 'Links',
        'fr': 'Liens',
        'es': 'Enlaces',
    },
    'footer.browse': {
        'en': 'Browse Apps',
        'fr': 'Parcourir les applications',
        'es': 'Explorar aplicaciones',
    },
    'footer.legal': {
        'en': 'Legal',
        'fr': 'Mentions légales',
        'es': 'Legal',
    },
    'footer.privacy': {
        'en': 'Privacy Policy',
        'fr': 'Politique de confidentialité',
        'es': 'Política de privacidad',
    },
    'language.select': {
        'en': 'Select language',
        'fr': 'Choisir la langue',
        'es': 'Seleccionar idioma',
    },
    'index.header': {
        'en': 'A list of all the apps currently available through the App Fair Project',
        'fr': 'Une liste de toutes les applications actuellement disponibles via le projet App Fair',
        'es': 'Una lista de todas las aplicaciones actualmente disponibles a través del Proyecto App Fair',
    },
    'index.title': {
        'en': 'The App Fair Apps',
        'fr': 'Les applications App Fair',
        'es': 'Las aplicaciones de App Fair',
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
