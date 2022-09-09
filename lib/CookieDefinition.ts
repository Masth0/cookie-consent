import {getAllCookies} from "./utils";

export class CookieDefinition {
  private _enabled: boolean = false;
  private _accepted: boolean = false;

  get id(): string {
    return `${this.categoryName}_${this.name}`;
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  get isAccepted(): boolean {
    return !this.isRevocable ? true : this._accepted;
  }

  set accepted(value: boolean) {
    this._accepted = value;
  }

  get name(): string {
    return this.config.name;
  }

  get description(): string {
    return this.config.description;
  }

  get isRevocable(): boolean {
    return this.config.revocable;
  }

  get categoryName(): string {
    return this.config.categoryName || 'undefined';
  }

  set categoryName(value: string) {
    this.config.categoryName = value;
  }

  constructor(private config: CookieDefinitionConfig) {
    this.config = config;
  }

  /**
   * Make scripts executable and add them to the DOM
   */
  enable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAccepted) reject('Cookie is not accepted');
      let newScriptTags: HTMLScriptElement[] = [];

      this.config.scripts.forEach((script) => {
        if (script.type !== 'cookie-consent') return;
        const copy = <HTMLScriptElement>CookieDefinition.copyScriptTag(script);

        if (copy.dataset.src) {
          copy.src = copy.dataset.src;
        } else {
          copy.type = copy.dataset.type || 'text/javascript';
        }

        newScriptTags.push(copy);
        script.insertAdjacentElement('beforebegin', copy);
        script.parentElement?.removeChild(script);
      });

      this.config.scripts = newScriptTags;
      this._enabled = true;
      resolve();
    });
  }

  /**
   * Find cookies by tokens and remove them
   */
  disable(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isRevocable && this.isEnabled) {
        const cookies: any[] = getAllCookies();

        for (const token of this.config.tokens) {
          const cookie = cookies.find((c) => {
            if (token.endsWith('*')) {
              const regex = new RegExp(token + "[^;]+");
              const match = regex.exec(c.name.slice(0, -1));
              return match && match[0] ? c : undefined;
            }

            return c.name === token;
          });

          if (cookie) {
            const expireDate = new Date('1970');
            document.cookie = `${cookie.name}=; expires=${expireDate.toUTCString()}; Domain=${window.location.host.split(':')[0]}; Max-Age=0; path=/;`;
          }

        }
        this._enabled = false;
        this._accepted = false;
      }
      resolve();
    });
  }

  addScripts(scripts: HTMLScriptElement[]) {
    this.config.scripts = [...this.config.scripts, ...scripts];
  }

  addTokens(tokens: string[]) {
    this.config.tokens = [...this.config.tokens, ...tokens];
  }

  private static copyScriptTag(script: HTMLScriptElement): HTMLScriptElement {
    const copy: HTMLScriptElement = document.createElement('script');

    for (let i = 0; i < script.attributes.length; i++) {
      const attr = script.attributes[i];
      copy.setAttribute(attr.name, attr.value);
      copy.innerHTML = script.innerHTML;
    }

    return copy;
  }
}

export interface CookieDefinitionConfig {
  categoryName?: string;
  name: string;
  description: string;
  revocable: boolean;
  accepted: boolean;
  scripts: HTMLScriptElement[];
  tokens: string[];
}

export enum cookieDefinitionEvent {
  BeforeEnable = 'before:enable',
  BeforeDisable = 'before:disable',
  AfterEnable = 'after:enable',
  AfterDisable = 'after:disable',
}
