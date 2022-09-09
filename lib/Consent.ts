import {Category} from "./Category";
import {ConsentUI, UIEvent, UITranslations} from "./ConsentUI";
import {getCookieValue} from "./utils";
import {CookieDefinition} from "./CookieDefinition";


// TODO ajouter le focus trap
export class Consent {
  #cookieToken: string = '_cookie_consent';
  private UI: ConsentUI;
  private needToReload: Boolean = false;

  constructor(private config: ConsentConfig) {
    this.UI = new ConsentUI(this.config.categories, this.config.translations);
    this.UI.init();
  }

  async init(): Promise<Consent> {
    // Voir si le cookie du consentement existe
    const userConsent: UserConsent | undefined = this.getUserConsent();
    // S'il existe et si sa version est différente de celle de l'instance
    if (!userConsent || (userConsent && userConsent.version !== this.config.version)) {
      // On supprime le cookie et les cookies connus dans Cookie.tokens
      // Demander le consentement
      this.UI.show();
    } else {
      this.updateConsentFromStorage(userConsent);
    }

    await this.enableAccepted();

    this.UI.container.addEventListener(UIEvent.Change, (e: CustomEventInit) => {
      const cookieChanged: CookieDefinition = e.detail.cookie;
      const category: Category|undefined = this.getCategoryByName(cookieChanged.categoryName);
      if (category) {
        const cookie: CookieDefinition|undefined = category.getCookie(cookieChanged.name);
        if (cookie) {
          if (!this.needToReload) this.needToReload = (!e.detail.checkbox.checked && cookie.isEnabled);
          cookie.accepted = e.detail.checkbox.checked;
        }
      }
    });

    this.UI.container.addEventListener(UIEvent.Save, async () => {
      await this.save(UIEvent.Save);
      this.UI.hide();
    });

    this.UI.container.addEventListener(UIEvent.AcceptAll, async () => {
      await this.save(UIEvent.AcceptAll);
      this.UI.hide();
    });

    this.UI.container.addEventListener(UIEvent.Reject, async () => {
      await this.save(UIEvent.Reject);
      this.UI.hide();
    });

    return Promise.resolve(this);
  }

  show() {
    this.UI.show();
  }
  hide() {
    this.UI.hide();
  }

  private async save(eventName: UIEvent) {
    switch (eventName) {
      case UIEvent.Save:
        await this.enableAccepted();
        break;
      case UIEvent.AcceptAll:
        await this.acceptAll(true)
          .then(() => {
            this.UI.update(this.config.categories);
          })
        break;
      case UIEvent.Reject:
        await this.acceptAll(false)
          .then(() => {
            this.UI.update(this.config.categories);
          })
        break;
    }

    this.saveUserConsent();

    if (this.config.forceReload && this.needToReload) {
      window.location.reload();
      this.needToReload = false;
    }

  }


  private updateConsentFromStorage(data: UserConsent) {
    data.cookies.forEach((cookieSaved: CookieSaved) => {
      const cat: Category|undefined = this.getCategoryByName(cookieSaved.category);
      if (cat) {
        const cookie: CookieDefinition|undefined = cat.getCookie(cookieSaved.name);
        if (cookie) {
          cookie.accepted = cookieSaved.accepted;
        }
      }
    });
    this.UI.update(this.config.categories);
  }

  private saveUserConsent() {
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 12);
    document.cookie = `${this.#cookieToken}=${this.serializeUserConsent()}; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax;`;
  }

  private serializeUserConsent() {
    let storage: ConsentSaved = {
      version: this.config.version,
      cookies: []
    };

    this.config.categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: CookieDefinition) => {
        storage.cookies.push({
          category: category.name,
          name: cookie.name,
          accepted: cookie.isAccepted
        });
      })
    });

    return JSON.stringify(storage);
  }

  private getUserConsent(): UserConsent|undefined {
    const cookieValue: string|undefined = getCookieValue(this.#cookieToken);
    return cookieValue ? JSON.parse(cookieValue) as UserConsent: undefined;
  }
  
  private getCategoryByName(name: string): Category|undefined {
    return this.config.categories.find((category: Category) => category.name === name);
  }

  private acceptAll(value: boolean): Promise<void[]> {
    let cookiePromises: Promise<void>[] = [];
    for (let i = 0; i < this.config.categories.length; i++) {
      for (let j = 0; j < this.config.categories[i].cookies.length; j++) {
        const cookie: CookieDefinition = this.config.categories[i].cookies[j];
        if (cookie.isRevocable) {
          if (cookie.isAccepted && !value) this.needToReload = true;

          cookie.accepted = value;

          if (value) {
            cookiePromises.push(cookie.enable());
          } else {
            cookiePromises.push(cookie.disable());
          }
        }
      }
    }

    return Promise.all(cookiePromises);
  }

  private enableAccepted(): Promise<void[]> {
    let cookiePromises: Promise<void>[] = [];
    for (let i = 0; i < this.config.categories.length; i++) {
      for (let j = 0; j < this.config.categories[i].cookies.length; j++) {
        const cookie: CookieDefinition = this.config.categories[i].cookies[j];
        if (cookie.isAccepted) {
          cookiePromises.push(cookie.enable());
        } else {
          cookiePromises.push(cookie.disable());
        }
      }
    }
    return Promise.all(cookiePromises);
  }

}

export interface ConsentConfig {
  localeFallback: string;
  version: number;
  forceReload: boolean;
  categories: Category[];
  onSave?: (config: ConsentConfig) => void;
  onReject?: (config: ConsentConfig) => void;
  translations: UITranslations;
}

export interface CookieSaved {
  category: string;
  name: string;
  accepted: boolean;
}

export interface ConsentSaved {
  version: number;
  cookies: CookieSaved[];
}

export interface UserConsent {
  version: number;
  cookies: CookieSaved[];
}
