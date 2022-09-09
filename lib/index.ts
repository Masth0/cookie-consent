import {Consent, ConsentConfig} from "./Consent";
import {Category} from "./Category";
import {getCategoriesFromDomScripts, mergeCategories, UITranslationsDefault} from "./utils";
import {CookieDefinition} from "./CookieDefinition";

export function setup(config: ConsentConfig, scriptTagsSelector: string = 'script[type="cookie-consent"]'): Promise<Consent> {
  // Parse script tags and get config from them
  const scriptTagsCategories: Category[] = getCategoriesFromDomScripts(scriptTagsSelector);
  // Merge script tags categories with categories arg.
  config.categories = mergeCategories(scriptTagsCategories, config.categories);

  // Instantiate Consent (return promise)
  const consent: Consent = new Consent(config);

  return new Promise(resolve => {
    consent.init().then(() => {
      return resolve(consent);
    })
  });
}

export function createCategory(name: string, description: string, cookies: CookieDefinition[] = []): Category {
  return new Category({name, description, cookies});
}

const CookieConsent = {
  setup,
  createCategory,
  Category,
  CookieDefinition,
  UITranslationsDefault,
  UIEvent
};

export default CookieConsent;
