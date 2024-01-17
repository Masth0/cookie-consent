import { Cookie, CookieConfig } from "./Cookie.ts";
import { LanguageCode } from "./Translations.ts";
import { CategoryElement } from "./ui/CategoryElement.ts";

export type CategoryTranslations = { [key in LanguageCode | string]?: Pick<Category, "name" | "description"> };
export type CategoryMessages = Pick<Category, "name" | "description">;
export interface CategoryConfig {
  name: string;
  description?: string;
  cookies?: Map<string, Cookie>;
  translations?: CategoryTranslations;
}
export class Category {
  get name(): string {
    return this.#name;
  }

  get description(): string {
    return this.#description;
  }

  get cookies(): Map<string, Cookie> {
    return this.#cookies;
  }

  get translations(): CategoryTranslations {
    return this.#translations;
  }

  get element(): CategoryElement {
    return this.#element;
  }

  #name: string;
  #description: string;
  #cookies: Map<string, Cookie>;
  #translations: CategoryTranslations;
  #element: CategoryElement;

  constructor(config: CategoryConfig) {
    this.#name = config.name;
    this.#description = config.description || "";
    this.#cookies = config.cookies || new Map();
    this.#translations = config.translations || {};
    // Create html element
    this.#element = new CategoryElement(this.#name);
    this.element.setMessages({ name: this.#name, description: this.#description });
  }

  /**
   * @param {CookieConfig} config
   * @returns {this}
   */
  addCookie(config: CookieConfig): this {
    const cookieFound: Cookie | undefined = this.#cookies.get(config.name);
    if (cookieFound) {
      this.mergeCookie(cookieFound, new Cookie(config));
    } else {
      const newCookie = new Cookie(config);
      newCookie.categoryName = this.#name;
      this.#cookies.set(config.name, newCookie);
    }

    return this;
  }

  /**
   * Add new translations
   * @param {CookieTranslations} translations
   */
  addTranslations(translations: CategoryTranslations) {
    for (const translationsKey in translations) {
      if (!this.translations.hasOwnProperty(translationsKey)) {
        this.translations[translationsKey] = translations[translationsKey];
      }
    }
  }

  mergeCookie(cookieRef: Cookie, cookie: Cookie) {
    if (cookieRef.name !== cookie.name) return;

    // Keep the first description or update with the new one?
    if (cookieRef.description !== cookie.description) {
      cookieRef.description = cookie.description;
    }

    if (cookieRef.isRevocable !== cookie.isRevocable) {
      console.error(`Cookie ${cookieRef.name} is already configured to not revocable. Change it on the first instance.`);
    }

    if (cookieRef.domain !== cookie.domain) {
      cookieRef.domain = cookie.domain;
    }

    // Merge tokens
    cookieRef.addTokens(cookie.tokens);
    // Add script tags
    cookieRef.addScripts(cookie.scripts);
    // Add translations
    cookieRef.addTranslations(cookie.translations);
  }
}
