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
    de: 'hre Privatsphäre ist uns wichtig',
  },
  description: {
    fr: 'Nous utilisons des cookies pour nous assurer du bon fonctionnement de notre site, pour personnaliser notre contenu et nos publicités et afin d’analyser notre trafic. En utilisant ce site Internet ou en fermant ce bandeau, vous consentez à l\'utilisation de ces cookies.',
    en: 'We use cookies to ensure that our site functions properly, to personalize our content and advertising, and to analyze our traffic. By using this website or closing this banner, you consent to the use of these cookies.',
    de: 'We use cookies to ensure that our site functions properly, to personalize our content and advertising, and to analyze our traffic. By using this website or closing this banner, you consent to the use of these cookies.',
  },
  btn: {
    params: {
      fr: 'Gérer les préférences',
      en: 'Manage my preferences',
      de: 'Einstellungen ändern',
    },
    closeParams: {
      fr: 'Fermer les préférences',
      en: 'Close my preferences',
      de: 'Einstellungen Schließen',
    },
    reject: {
      fr: 'Je refuse',
      en: 'I refuse',
      de: 'Ich lehne ab',
    },
    saveAll: {
      fr: 'J\'accepte',
      en: 'I accept',
      de: 'Alle akzeptieren',
    },
    save: {
      fr: 'Enregistrer la sélection',
      en: 'Save selection',
      de: 'Einstellungen speichern',
    },
    continue: {
      fr: 'Continuer sans accepter',
      en: 'Continue without accepting',
      de: 'Fortfahren ohne zu akzeptieren',
    },
  }
};
