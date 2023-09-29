import { Cookie, CookieConfig } from "./Cookie.ts";
import { LanguageCode } from "./Translations.ts";

export class Category {
  get cookies(): Map<string, Cookie> {
    return this.#cookies;
  }

  name: string;
  description: string;
  translations: { [key in LanguageCode]?: Pick<Category, "name" | "description"> };
  #cookies: Map<string, Cookie> = new Map();

  constructor(name: string, description?: string, translations?: { [key in LanguageCode]?: Pick<Category, "name" | "description"> }) {
    this.name = name;
    this.description = description || "";
    this.translations = translations || {};
    return this;
  }

  addCookie(cookieConfig: CookieConfig): Category {
    const cookie = this.#cookies.get(cookieConfig.name);
    if (cookie) {
      cookie.addScripts(cookie.scripts);
      cookie.addTokens(cookie.tokens);
    } else {
      const cookie: Cookie = new Cookie(cookieConfig);
      cookie.categoryName = this.name;
      this.cookies.set(cookie.name, cookie);
    }

    return this;
  }

  getCookie(name: string): Cookie | undefined {
    return this.cookies.get(name);
  }
}
