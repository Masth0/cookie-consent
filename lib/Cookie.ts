import { LanguageCode } from "./Translations.ts";
import { getAllCookies } from "./utils.ts";
import { CookieElement } from "./ui/CookieElement.ts";
import EventDispatcher, { ConsentEvent } from "./EventDispatcher.ts";

export type CookieTranslations = { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> };
export interface CookieConfig {
  name: string;
  description: string;
  revocable: boolean;
  domain?: string; // Needed to remove his cookies by tokens
  tokens?: string[];
  scripts?: HTMLScriptElement[];
  iframes?: HTMLIFrameElement[];
  translations?: CookieTranslations;
}

export class Cookie {
  get categoryName(): string {
    return this.#categoryName;
  }

  set categoryName(value: string) {
    this.#categoryName = value;
  }

  get name(): string {
    return this.#name;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get isRevocable(): boolean {
    return this.#revocable;
  }

  get isAccepted(): boolean {
    return this.#accepted;
  }

  set accepted(value: boolean) {
    this.#accepted = value;
    this.element.setChecked(value);
  }

  get isEnabled(): boolean {
    return this.#enabled;
  }

  get domain(): string {
    return this.#domain;
  }

  set domain(value: string) {
    this.#domain = value;
  }

  get tokens(): string[] {
    return this.#tokens;
  }

  get scripts(): HTMLScriptElement[] {
    return this.#scripts;
  }

  get translations(): CookieTranslations {
    return this.#translations;
  }

  get element(): CookieElement {
    return this.#element;
  }

  #categoryName: string = "";
  #name: string;
  #description: string;
  #revocable: boolean;
  #accepted: boolean = false;
  #enabled: boolean = false;
  #domain: string;
  #tokens: string[];
  #scripts: HTMLScriptElement[];
  #iframes: HTMLIFrameElement[]; // Todo retrieve iframes with data-cc-name
  #translations: { [key in LanguageCode | string]?: Pick<Cookie, "name" | "description"> };
  #element: CookieElement;
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();

  constructor(config: CookieConfig) {
    this.#name = config.name;
    this.#description = config.description;
    this.#revocable = config.revocable;
    this.#domain = config?.domain || "";
    this.#tokens = config?.tokens || [];
    this.#scripts = config?.scripts || [];
    this.#iframes = config?.iframes || [];
    this.#translations = config?.translations || {};
    // Create html element
    this.#element = new CookieElement(this.#name);
    this.#element.updateMessages({ name: this.#name, description: this.#description });
    if (this.isRevocable) {
      this.#dispatcher.addListener(ConsentEvent.CookieChange, this.onCookieChange.bind(this));
    }
  }

  /**
   * Make scripts executable and add them to the DOM
   */
  enable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isEnabled) reject("Cookie " + this.name + " is already enabled");
      let newScriptTags: HTMLScriptElement[] = [];

      if (this.#scripts) {
        this.#scripts.forEach((script) => {
          const copy = this.createScriptTag(script);
          if (copy) {
            script.insertAdjacentElement("beforebegin", copy);
            script.parentElement?.removeChild(script);
          }
        });

        this.#scripts = newScriptTags;
      }
      this.#enabled = true;
      resolve();
    });
  }

  /**
   * Find cookies by tokens and remove them
   */
  disable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRevocable) reject("Cookie " + this.name + " isn't revocable.");
      if (this.isRevocable && this.isEnabled) {
        const cookiesFound = this.retrieveCookiesByTokens();
        for (const cookieFound of cookiesFound) {
          const expireDate = new Date("1970");
          let domain: string = location.hostname.replace("www", "");
          document.cookie = `${cookieFound.name}=; expires=${expireDate.toUTCString()}; domain=${domain}; max-age=0; path=/;`;
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
  
  addIframes(iframes: HTMLIFrameElement[]) {
    this.#iframes = [...this.#iframes, ...iframes];
  }

  addTokens(tokens: string[]): string[] {
    for (const token of tokens) {
      const trimmedToken = token.trim();
      if (trimmedToken && this.#tokens.indexOf(trimmedToken) === -1) {
        this.tokens.push(trimmedToken);
      }
    }

    return this.tokens;
  }

  /**
   * Add new translations
   * @param {CookieTranslations} translations
   */
  addTranslations(translations: CookieTranslations) {
    for (const translationsKey in translations) {
      if (!this.translations.hasOwnProperty(translationsKey)) {
        this.translations[translationsKey] = translations[translationsKey];
      }
    }
  }

  private onCookieChange(name: string, checked: boolean) {
    if (name === this.#name) {
      this.#accepted = checked;
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

    copy.type = copy.dataset.type || "text/javascript";
    if (copy.dataset.src) {
      copy.src = copy.dataset.src;
    }

    return copy;
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
}
