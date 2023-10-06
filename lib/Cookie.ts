import { getAllCookies } from "./utils.ts";
import { LanguageCode } from "./Translations.ts";

export interface CookieConfig {
  name: string;
  description: string;
  revocable: boolean;
  domain?: string; // Needed to remove his cookies by tokens
  tokens: string[];
  scripts?: HTMLScriptElement[];
  translations?: { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> };
}

export class Cookie {
  get categoryName(): string {
    return this._categoryName;
  }

  set categoryName(value: string) {
    this._categoryName = value;
  }
  get isEnabled(): boolean {
    return this.#enabled;
  }

  set enabled(value: boolean) {
    this.#enabled = value;
  }

  get domain(): string | undefined {
    return this.#config.domain;
  }

  get tokens(): string[] {
    return this.#config.tokens;
  }

  get scripts(): HTMLScriptElement[] {
    return this.#config.scripts ?? [];
  }

  get isRevocable(): boolean {
    return this.#config.revocable;
  }

  get name(): string {
    return this.#config.name;
  }

  get description(): string {
    return this.#config.description;
  }

  set description(value: string) {
    this.#config.description = value;
  }

  get isAccepted(): boolean {
    return this.#accepted;
  }

  set accepted(value: boolean) {
    this.#accepted = value;
  }

  get config(): CookieConfig {
    return this.#config;
  }

  set translations(value: { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> }) {
    this.#translations = value;
  }

  get translations(): { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> } {
    return this.#translations;
  }

  #enabled: boolean = false;
  #accepted: boolean = false;
  #translations: { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> };
  readonly #config: CookieConfig;
  private _categoryName: string = ""; // Set by .addCookie in Category

  constructor(config: CookieConfig) {
    this.#config = config;
    this.#translations = this.#config.translations || {};
    if (!this.isRevocable) {
      this.accepted = true;
    }
  }

  private static copyScriptTag(script: HTMLScriptElement): HTMLScriptElement {
    const copy: HTMLScriptElement = document.createElement("script");

    for (let i = 0; i < script.attributes.length; i++) {
      const attr = script.attributes[i];
      copy.setAttribute(attr.name, attr.value);
      copy.innerHTML = script.innerHTML;
    }

    return copy;
  }

  /**
   * Make scripts executable and add them to the DOM
   */
  enable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.enabled) reject("Cookie " + this.name + " is already enabled");
      let newScriptTags: HTMLScriptElement[] = [];

      if (this.#config.scripts) {
        this.#config.scripts.forEach((script) => {
          const copy = this.createScriptTag(script);
          if (copy) {
            script.insertAdjacentElement("beforebegin", copy);
            script.parentElement?.removeChild(script);
          }
        });

        this.config.scripts = newScriptTags;
      }
      this.enabled = true;
      resolve();
    });
  }

  /**
   * Find cookies by tokens and remove them
   */
  disable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRevocable && !this.isAccepted) reject("Cookie " + this.name + " isn't revocable.");
      if (this.isRevocable && this.isEnabled) {
        const cookiesFound = this.retrieveCookiesByTokens();
        for (const cookieFound of cookiesFound) {
          const expireDate = new Date("1970");
          let domain: string = location.hostname.replace("www", "");
          document.cookie = `${cookieFound.name}=; expires=${expireDate.toUTCString()}; Domain=${domain}; Max-Age=0; path=/;`;
        }

        this.#enabled = false;
        this.#accepted = false;
      }
      resolve();
    });
  }

  addScripts(scripts: HTMLScriptElement[]) {
    for (const newScript of scripts) {
      const same: HTMLScriptElement[] = this.scripts.filter((s) => {
        return newScript.firstChild === s.firstChild; // I have doubts about that...
      });
      if (same.length === 0) {
        this.scripts.push(newScript);
      }
    }
  }

  addTokens(tokens: string[]) {
    for (const token of tokens) {
      const trimmedToken = token.trim();
      if (trimmedToken.length > 0 && this.#config.tokens.indexOf(trimmedToken) === -1) {
        this.#config.tokens.push(trimmedToken);
      }
    }
  }

  private retrieveCookiesByTokens(): Array<{ name: string; value: string }> {
    const cookies = getAllCookies();
    const cookiesFound: { name: string; value: string }[] = [];

    for (const token of this.tokens) {
      const cookie = cookies.find((c) => {
        if (token.endsWith("*")) {
          const regex = new RegExp(token + "[^;]+");
          const match = regex.exec(c.name.slice(0, -1));
          return match && match[0] ? c : undefined;
        }

        return c.name === token;
      });

      if (cookie) cookiesFound.push(cookie);
    }

    return cookiesFound;
  }

  private createScriptTag(script: HTMLScriptElement) {
    if (script.type !== "cookie-consent") return;
    const copy = <HTMLScriptElement>Cookie.copyScriptTag(script);

    if (copy.dataset.src) {
      copy.src = copy.dataset.src;
    } else {
      copy.type = copy.dataset.type || "text/javascript";
    }

    return copy;
  }
}
