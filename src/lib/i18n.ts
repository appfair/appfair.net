
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

export function localDate(dateString?: string, locale: string, dateStyle: string): string {
    const dt: Date = Date.parse(dateString);
    if (dt != null) {
        const briefDate = new Intl.DateTimeFormat(locale, {
          dateStyle: dateStyle
        }).format(dt);
        return briefDate;
    }
    return dateString;
}

export function formatSize(bytes: number, locale: string): string {
    if (bytes === 0) {
        // Use a small fixed unit for zero bytes
        return new Intl.NumberFormat(locale, {
            style: 'unit',
            unit: 'byte',
            unitDisplay: 'narrow',
        }).format(0);
    }

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    // The value in the new unit (1024-based)
    const value = bytes / Math.pow(1024, i);
    
    // Determine the unit (we start at Bytes, which is not really a decimal unit)
    let unit: 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte';

    switch (i) {
        case 0:
            unit = 'byte';
            break;
        case 1:
            unit = 'kilobyte';
            break;
        case 2:
            unit = 'megabyte';
            break;
        case 3:
            unit = 'gigabyte';
            break;
        default:
            // For TB/PB/etc., which the prompt didn't strictly require, 
            // we'll just fall back to the largest unit or handle it gracefully.
            // Since the requested max is GB, this branch is mostly a safeguard.
            return `${value.toFixed(2)} ${sizes[i] || 'TB+'}`; 
    }

    // Use Intl.NumberFormat to handle locale-specific decimal separators and grouping
    return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: unit,
        unitDisplay: 'short', // 'KB' 'MB' 'GB'
        maximumFractionDigits: 2, // Max two decimal places
        minimumFractionDigits: value < 100 && value % 1 !== 0 ? 2 : 0, // Show decimals if value < 100
    }).format(value);
}