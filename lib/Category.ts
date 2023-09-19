import { Cookie, CookieConfig } from "./Cookie.ts";

export class Category {
  get cookies(): Map<string, Cookie> {
    return this.#cookies;
  }

  name: string;
  description: string;
  #cookies: Map<string, Cookie> = new Map();

  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description || "";
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
