import {Category} from "./Category";
import {CookieDefinition} from "./CookieDefinition";

export function findCookieByName(name: string): string[] {
  let result: string[] = [];
  let _name: string = name.endsWith('*') ? name.slice(0, -1) : name;
  console.log(_name)
  let cookieStr: string = decodeURIComponent(document.cookie);
  const regex: RegExp = new RegExp(_name + "[^;]+");
  const matches = regex.exec(cookieStr);

  if (matches) {
    console.log(matches[0].split('='))
    // cookieStr = cookieStr.substring(cookieStr.indexOf(_name), cookieStr.length);
    // resultStr: string = cookieStr.split(';').shift();
    // cookieStr.substring(cookieStr.indexOf(resultStr), cookieStr.length);
    // console.log();
    // Todo à finir
  }

  return result;
}

/**
 * Get value of a cookie
 */
export function getCookieValue(name: string): string|undefined {
  const value = '; ' + document.cookie;
  let parts = value.split('; ' + name + '=');
  return parts.length < 2 ? undefined : parts.pop()?.split(';').shift();
}

export function getAllCookies() {
  return document.cookie.split(';')
    .map((str) => {
      const [name, value] = str.split('=').map((v) => v.trim());
      return {name, value}
    });
}

export function getCategoriesFromDomScripts(selector: string): Category[] {
  let categories: Category[] = [];

  const $scripts = [].slice.call(document.querySelectorAll(selector));

  for (let i = 0; i < $scripts.length; i++) {
    const $script: HTMLScriptElement = $scripts[i];
    const name: string|undefined = $script.dataset.name;
    const description: string|undefined = $script.dataset.description || '';
    const accepted: boolean|undefined = $script.hasAttribute('data-accepted');
    const revocable: boolean|undefined = !($script.hasAttribute('data-revocable') && $script.dataset.revocable === 'false');
    const categoryName: string = $script.dataset.category || 'undefined';

    // Tokens
    const tokensStr: string|undefined = $script.dataset.tokens;
    let tokens: string[] = [];
    if (tokensStr) {
      tokens = tokensStr.split(',');
      tokens = tokens.map(token => token.trim());
    }

    if (name === undefined) {
      console.error(`Name is missing on: ${$script.outerHTML}`);
      continue; // Go to next script
    }

    let category: Category|undefined = categories.find((c: Category) => c.name === categoryName);

    if (category === undefined) {
      category = new Category({name: categoryName, description: '', cookies: []});
      categories.push(category);
    }

    let cookie: CookieDefinition|undefined = category.cookies.find((c: CookieDefinition) => c.name === name);

    if (cookie === undefined) {
      category.addCookie({
        categoryName,
        name: name.trim(),
        description: description.trim(),
        scripts: [$script],
        tokens: tokens,
        accepted: accepted,
        revocable: revocable
      });
    } else {
      cookie.addScripts([$script]);
      cookie.addTokens(tokens);
    }

  }

  return categories;
}

export function mergeCategories(a: Category[], b: Category[]) {
  const copy: Category[] = a.slice();

  for (let i = 0; i < b.length; i++) {
    const categoryB: Category = b[i];
    const categoryA: Category|undefined = a.find((c: Category) => c.name === categoryB.name);

    if (categoryA === undefined) {
      copy.push(categoryB);
      continue;
    }

    /*if (categoryA.description.length < categoryB.description.length) {
      categoryA.description = categoryB.description;
    }*/

    // Merge cookies
    for (let j = 0; j < categoryB.cookies.length; j++) {
      const cookieB: CookieDefinition = categoryB.cookies[j];
      const cookieA: CookieDefinition|undefined = categoryA.cookies.find((c: CookieDefinition) => c.name === cookieB.name);

      if (cookieA === undefined) {
        categoryA?.cookies.push(cookieB);
      }
    }
  }

  return copy;
}

export const UITranslationsDefault = {
  title: {
    fr: 'Nous utilisons des cookies',
    en: 'We use cookies',
    de: 'Wir verwenden Cookies',
  },
  description: {
    fr: 'Nous utilisons des cookies pour nous assurer du bon fonctionnement de notre site, pour personnaliser notre contenu et nos publicités et afin d’analyser notre trafic. En utilisant ce site Internet ou en fermant ce bandeau, vous consentez à l\'utilisation de ces cookies.',
    en: 'We use cookies to ensure that our site functions properly, to personalize our content and advertising, and to analyze our traffic. By using this website or closing this banner, you consent to the use of these cookies.',
    de: 'Wir verwenden Cookies, um sicherzustellen, dass unsere Website ordnungsgemäß funktioniert, um unseren Inhalt und unsere Werbung zu personalisieren und um unseren Datenverkehr zu analysieren. Durch die Nutzung dieser Website oder das Schließen dieses Banners stimmen Sie der Verwendung dieser Cookies zu.',
  },
  btn: {
    params: {
      fr: 'Gérer les préférences',
      en: 'Manage my preferences',
      de: 'Präferenzen verwalten',
    },
    closeParams: {
      fr: 'Fermer les préférences',
      en: 'Close preferences',
      de: 'Präferenzen schliessen',
    },
    reject: {
      fr: 'Refuser',
      en: 'Deny',
      de: 'Ablehnen',
    },
    saveAll: {
      fr: 'Accepter',
      en: 'Accept',
      de: 'Alle akzeptieren',
    },
    save: {
      fr: 'Enregistrer la sélection',
      en: 'Save selection',
      de: 'Auswahl speichern',
    },
    continue: {
      fr: 'Continuer sans accepter',
      en: 'Continue without accepting',
      de: 'Ohne Zustimmung fortfahren',
    },
  },
  categories: {
    mandatory: {
      title: {
        fr: 'Obligatoire',
        en: 'Mandatory',
        de: 'Erforderlich'
      },
      description: {
        fr: 'Cookies requis pour le bon fonctionnement du site.',
        en: 'We use required cookies to perform essential website functions.',
        de: ''
      }
    }
  }
};


/*

import CookieConsent from '@masth0/cookie-consent';

// Cookie consent
const locale = document.documentElement.getAttribute('lang') || 'en';
const consentTranslations = CookieConsent.UITranslationsDefault;
consentTranslations.title.de = "Wir verwenden Cookies"
consentTranslations.description = {
  fr: "Nous utilisons des cookies pour nous assurer du bon fonctionnement de notre site, pour personnaliser notre contenu et nos publicit\xE9s et afin d\u2019analyser notre trafic. En utilisant ce site Internet ou en fermant ce bandeau, vous consentez \xE0 l'utilisation de ces cookies.",
  en: "We use cookies to make sure our website works properly, to personalise our content and advertising and to analyse our traffic. By using this website or closing this banner, you consent to the use of these cookies.",
  de: "Wir verwenden Cookies, um sicherzustellen, dass unsere Website ordnungsgemäß funktioniert, um unseren Inhalt und unsere Werbung zu personalisieren und um unseren Datenverkehr zu analysieren. Durch die Nutzung dieser Website oder das Schließen dieses Banners stimmen Sie der Verwendung dieser Cookies zu."
};
consentTranslations.btn.continue.de = 'fortsetzen ohne akzeptieren';
consentTranslations.btn.reject = {
  fr: "Je refuse",
  en: "Deny",
  de: "ablehnen"
};
consentTranslations.btn.saveAll = {
  fr: "J'accepte",
  en: "Accept",
  de: "Alle akzeptieren"
};
consentTranslations.btn.continue.de = "Ohne Zustimmung fortfahren";
consentTranslations.btn.params.de = "Präferenzen verwalten";
consentTranslations.btn.closeParams.de = "Präferenzen schliessen";
consentTranslations.btn.save.de = "Auswahl speichern";
consentTranslations.btn.closeParams.en = "Close preferences";

const translations = {
  mandatoryCategory: {
    title: {
      fr: 'Obligatoire',
      en: 'Mandatory',
      de: 'Erforderlich'
    },
  },
  sessionId: {
    fr: {
      title: 'Identifiant de session',
      description: 'Permet de connaitre l\'identifiant de session. La session est utilisée pour la navigation et la sécurité des formulaires (CSRF) PHPSESSID',
    },
    en: {
      title: 'Session ID',
      description: 'Allows to know the session identifier. The session is used for navigation and form security (CSRF) PHPSESSID',
    },
    de: {
      title: 'Sitzung ID',
      description: 'Ermöglicht es, die Sitzungs-ID zu erfahren. Die Sitzung wird für die Navigation und die Formularsicherheit (CSRF) verwendet PHPSESSID',
    },
  }
}

const mandatory = CookieConsent.createCategory(translations.mandatoryCategory.title[locale], '');
mandatory.addCookie({
  accepted: true,
  revocable: false,
  name: translations.sessionId[locale].title,
  description: translations.sessionId[locale].description,
  scripts: [],
  tokens: ['PHPSESSID']
});

CookieConsent.setup({
  localeFallback: 'en',
  version: 1,
  categories: [
    mandatory
  ],
  forceReload: true,
  translations: consentTranslations,
  onSave: () => {},
  onReject: () => {},
}).then((consent) => {
  const $btnOpenConsent = document.querySelector('[data-cc-show]');
  if ($btnOpenConsent) {
    $btnOpenConsent.addEventListener('click', function() {
      consent.show();
    })
  }
});

*/