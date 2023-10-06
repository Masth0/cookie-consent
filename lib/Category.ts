import { Cookie, CookieConfig } from "./Cookie.ts";
import { LanguageCode } from "./Translations.ts";

export class Category {
  get cookies(): Map<string, Cookie> {
    return this.#cookies;
  }

  name: string;
  description: string;
  translations: { [key in LanguageCode | string]?: Pick<Category, "name" | "description"> };
  #cookies: Map<string, Cookie> = new Map();

  constructor(name: string, description?: string, translations?: { [key in LanguageCode | string]?: Pick<Category, "name" | "description"> }) {
    this.name = name;
    this.description = description || "";
    this.translations = translations || {};
    return this;
  }

  addCookie(cookieConfig: CookieConfig): Category {
    const cookie = this.getCookie(cookieConfig.name);

    if (cookie) {
      if (cookieConfig.scripts) {
        cookie.addScripts(cookieConfig.scripts);
      }
      if (cookieConfig.tokens) {
        cookie.addTokens(cookieConfig.tokens);
      }
      if (cookieConfig.translations) {
        cookie.translations = { ...cookie.translations, ...cookieConfig.translations };
      }
    } else {
      // Create new Cookie
      const newCookie: Cookie = new Cookie(cookieConfig);
      newCookie.categoryName = this.name;
      this.cookies.set(newCookie.name, newCookie);
    }

    return this;
  }

  getCookie(name: string): Cookie | undefined {
    return this.cookies.get(name);
  }
}
