
export const languages = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  icon: null, // an icon representation of the term
};

export const defaultLang = 'en';

type Translations = Record<keyof typeof languages, string>;

const ui = {
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
    'app.releasedate': {
        'en': 'Release Date',
        'fr': 'Date de sortie',
        'es': 'Fecha de lanzamiento',
    },
    'app.version': {
        'en': 'Version',
        'fr': 'Version',
        'es': 'Versión',
    },
    'app.size': {
        'en': 'Size',
        'fr': 'Taille',
        'es': 'Tamaño',
    },
    'app.about': {
        'en': 'About This App',
        'fr': 'À propos de cette app',
        'es': 'Acerca de esta app',
    },
    'app.devres': {
        'en': 'Developer Resources',
        'fr': 'Ressources pour développeurs',
        'es': 'Recursos del desarrollador',
    },
    'app.devres.source': {
        'en': 'Source Code',
        'fr': 'Code source',
        'es': 'Código fuente',
    },    'app.privacy': {
        'en': 'App Privacy',
        'fr': 'Confidentialité de l’app',
        'es': 'Privacidad de la app',
    },
    'app.whatsnew': {
        'en': 'What\'s New',
        'fr': 'Nouveautés',
        'es': 'Novedades',
    },
    'app.privacy.learn': {
        'en': 'Learn about data protection',
        'fr': 'En savoir plus sur la protection des données',
        'es': 'Información sobre la protección de datos',
    },
    'app.screenshots': {
        'en': 'Screenshots',
        'fr': 'Captures d’écran',
        'es': 'Capturas de pantalla',
    },
    'app.permissions': {
        'en': 'Permissions',
        'fr': 'Autorisations',
        'es': 'Permisos',
    },
    'app.entitlements': {
        'en': 'Entitlements',
        'fr': 'Droits',
        'es': 'Derechos',
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
    },

    // https://developer.apple.com/documentation/bundleresources/information-property-list/nscamerausagedescription
    'app.permissions.ios.NSCameraUsageDescription': {
        'en': 'Camera Access',
        'fr': 'Accès à la caméra',
        'es': 'Acceso a la cámara',
        'icon': 'photo_camera',
    },
    'app.permissions.ios.NSMicrophoneUsageDescription': {
        'en': 'Microphone Access',
        'fr': 'Accès au microphone',
        'es': 'Acceso al micrófono',
        'icon': 'mic',
    },
    
    // --- Photo Library ---
    'app.permissions.ios.NSPhotoLibraryUsageDescription': {
        'en': 'Photo Library Access',
        'fr': 'Accès à la bibliothèque de photos',
        'es': 'Acceso a la fototeca',
        'icon': 'photo_library',
    },
    'app.permissions.ios.NSPhotoLibraryAddUsageDescription': {
        'en': 'Save to Photo Library Access',
        'fr': 'Accès pour enregistrer dans la photothèque',
        'es': 'Acceso para guardar en la fototeca',
        'icon': 'add_photo_alternate',
    },
    
    // --- Location Services ---
    'app.permissions.ios.NSLocationWhenInUseUsageDescription': {
        'en': 'Location Access While in Use',
        'fr': 'Accès à la localisation lors de l\'utilisation',
        'es': 'Acceso a la ubicación solo en uso',
        'icon': 'location_on',
    },
    'app.permissions.ios.NSLocationAlwaysAndWhenInUseUsageDescription': {
        'en': 'Location Access Always',
        'fr': 'Accès à la localisation en tout temps',
        'es': 'Acceso a la ubicación siempre',
        'icon': 'location_on',
    },
    // Note: NSLocationAlwaysUsageDescription is deprecated (iOS 11+) but included for completeness on older targets.
    'app.permissions.ios.NSLocationAlwaysUsageDescription': {
        'en': 'Location Access Always (Legacy)',
        'fr': 'Accès à la localisation en tout temps (Hérité)',
        'es': 'Acceso a la ubicación siempre (Heredado)',
        'icon': 'location_on',
    },
    
    // --- Contacts, Calendar, and Reminders ---
    'app.permissions.ios.NSContactsUsageDescription': {
        'en': 'Contacts Access',
        'fr': 'Accès aux contacts',
        'es': 'Acceso a los contactos',
        'icon': 'contacts',
    },
    'app.permissions.ios.NSCalendarsUsageDescription': {
        'en': 'Calendar Access',
        'fr': 'Accès au calendrier',
        'es': 'Acceso al calendario',
        'icon': 'calendar_month',
    },
    'app.permissions.ios.NSRemindersUsageDescription': {
        'en': 'Reminders Access',
        'fr': 'Accès aux rappels',
        'es': 'Acceso a los recordatorios',
        'icon': 'list_alt',
    },
    
    // --- Other Services ---
    'app.permissions.ios.NSMotionUsageDescription': {
        'en': 'Motion and Fitness Activity Access',
        'fr': 'Accès aux données de mouvement et d\'activité',
        'es': 'Acceso a la actividad de movimiento y fitness',
        'icon': 'directions_run',
    },
    'app.permissions.ios.NSBluetoothAlwaysUsageDescription': {
        'en': 'Bluetooth Access',
        'fr': 'Accès au Bluetooth',
        'es': 'Acceso a Bluetooth',
        'icon': 'bluetooth',
    },
    'app.permissions.ios.NSSpeechRecognitionUsageDescription': {
        'en': 'Speech Recognition Access',
        'fr': 'Accès à la reconnaissance vocale',
        'es': 'Acceso al reconocimiento de voz',
        'icon': 'record_voice_over',
    },
    'app.permissions.ios.NSFaceIDUsageDescription': {
        'en': 'Face ID Access',
        'fr': 'Accès à Face ID',
        'es': 'Acceso a Face ID',
        'icon': 'face',
    },
    'app.permissions.ios.NSAppleMusicUsageDescription': {
        'en': 'Apple Music Library Access',
        'fr': 'Accès à la bibliothèque Apple Music',
        'es': 'Acceso a la biblioteca de Apple Music',
        'icon': 'library_music',
    },
    'app.permissions.ios.NSUserTrackingUsageDescription': {
        'en': 'Tracking User Activity',
        'fr': 'Suivi de l\'activité de l\'utilisateur',
        'es': 'Seguimiento de la actividad del usuario',
        'icon': 'track_changes',
    },

    // https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment
    'app.entitlements.ios.aps-environment': {
        'en': 'Push Notification Environment',
        'fr': 'Environnement de notification push',
        'es': 'Entorno de notificación push',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.applesignin
    'app.entitlements.ios.com.apple.developer.applesignin': {
        'en': 'Sign in with Apple',
        'fr': 'Se connecter avec Apple',
        'es': 'Iniciar sesión con Apple',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.authentication-services.autofill-credential-provider
    'app.entitlements.ios.com.apple.developer.authentication-services.autofill-credential-provider': {
        'en': 'AutoFill Credential Provider',
        'fr': 'Fournisseur d\'identifiants AutoFill',
        'es': 'Proveedor de credenciales AutoFill',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.browser.app-installation
    'app.entitlements.ios.com.apple.developer.browser.app-installation': {
        'en': 'Browser App Installation (Alternative Distribution)',
        'fr': 'Installation d\'applications par le navigateur (Distribution alternative)',
        'es': 'Instalación de aplicaciones del navegador (Distribución alternativa)',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.web-browser
    'app.entitlements.ios.com.apple.developer.web-browser': {
        'en': 'Default Web Browser Capability',
        'fr': 'Capacité de navigateur web par défaut',
        'es': 'Capacidad de navegador web predeterminado',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups
    'app.entitlements.ios.com.apple.security.application-groups': {
        'en': 'App Groups',
        'fr': 'Groupes d\'applications',
        'es': 'Grupos de aplicaciones',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/keychain-access-groups
    'app.entitlements.ios.keychain-access-groups': {
        'en': 'Keychain Access Groups',
        'fr': 'Groupes d\'accès au trousseau',
        'es': 'Grupos de acceso a llavero',
    },
    
    // --- Additional Common Entitlements ---
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit
    'app.entitlements.ios.com.apple.developer.healthkit': {
        'en': 'HealthKit',
        'fr': 'HealthKit',
        'es': 'HealthKit',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.in-app-payments
    'app.entitlements.ios.com.apple.developer.in-app-payments': {
        'en': 'In-App Payments (Apple Pay)',
        'fr': 'Paiements intégrés (Apple Pay)',
        'es': 'Pagos dentro de la aplicación (Apple Pay)',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.icloud-container-identifiers
    'app.entitlements.ios.com.apple.developer.icloud-container-identifiers': {
        'en': 'iCloud Containers',
        'fr': 'Conteneurs iCloud',
        'es': 'Contenedores de iCloud',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.siri
    'app.entitlements.ios.com.apple.developer.siri': {
        'en': 'SiriKit',
        'fr': 'SiriKit',
        'es': 'SiriKit',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains
    'app.entitlements.ios.com.apple.developer.associated-domains': {
        'en': 'Associated Domains',
        'fr': 'Domaines associés',
        'es': 'Dominios asociados',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.networking.vpn.api
    'app.entitlements.ios.com.apple.developer.networking.vpn.api': {
        'en': 'Network Extensions (VPN)',
        'fr': 'Extensions réseau (VPN)',
        'es': 'Extensiones de red (VPN)',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.passkit.passes
    'app.entitlements.ios.com.apple.developer.passkit.passes': {
        'en': 'PassKit (Wallet/Apple Wallet)',
        'fr': 'PassKit (Portefeuille Apple)',
        'es': 'PassKit (Billetera/Apple Wallet)',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.homekit
    'app.entitlements.ios.com.apple.developer.homekit': {
        'en': 'HomeKit',
        'fr': 'HomeKit',
        'es': 'HomeKit',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.coremedia.camerainput
    'app.entitlements.ios.com.apple.developer.coremedia.camerainput': {
        'en': 'Camera Input Entitlement',
        'fr': 'Droit d\'accès Entrée caméra',
        'es': 'Derecho de acceso Entrada de cámara',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.default-browser
    'app.entitlements.ios.com.apple.developer.default-browser': {
        'en': 'Default Browser App',
        'fr': 'Application de navigateur par défaut',
        'es': 'Aplicación de navegador predeterminado',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.system-extension.install
    'app.entitlements.ios.com.apple.developer.system-extension.install': {
        'en': 'System Extension Installation',
        'fr': 'Installation d\'extension système',
        'es': 'Instalación de extensión del sistema',
    },
    
    // https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.authentication-services.identitycredential
    'app.entitlements.ios.com.apple.developer.authentication-services.identitycredential': {
        'en': 'Identity Credential Services',
        'fr': 'Services d\'identifiants d\'identité',
        'es': 'Servicios de credenciales de identidad',
    },

    // TODO: more entitlements here…
    // https://developer.apple.com/documentation/bundleresources/entitlements/XXX
    'app.entitlements.ios.XXX': {
        'en': null,
        'fr': null,
        'es': null,
    },
} satisfies Record<string, Translations>;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    const dict = ui[key];
    if (dict == null) {
        return key;
    }
    return dict[lang] || dict[defaultLang];
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