import { Category } from "./Category.ts";
import { arrayToMap, getCookieValue, isAttributeValid } from "./utils.ts";
import { Cookie } from "./Cookie.ts";
import { UI } from "./UI.ts";
import { ConsentMessages, LanguageCode, messages } from "./Translations.ts";
import FocusTrap from "./FocusTrap.ts";
import EventDispatcher, { ConsentEvent } from "./EventDispatcher.ts";

export interface ConsentConfig {
  locale: LanguageCode,
  version: number;
  forceToReload: boolean; // Force to reload on any changes when the user save his consent.
  categories: Category[];
  messages?: (messages: ConsentMessages) => ConsentMessages;
  translations: { [key in LanguageCode]?: ConsentMessages };
  onSave?: (config: ConsentConfig) => void;
  onReject?: (config: ConsentConfig) => void;
}

export interface DeserializedConsent {
  version: number;
  cookies: Pick<Cookie, "name" | "categoryName" | "accepted" | "isRevocable">[];
}

export function createCategoriesFromScriptTags(selector: string): Map<string, Category> {
  let categories: Map<string, Category> = new Map();
  const $scripts: HTMLScriptElement[] = Array.from(document.querySelectorAll<HTMLScriptElement>(selector));

  for (const $script of $scripts) {
    // Category
    const categoryName: string = $script.getAttribute("data-cc-category-name")?.trim() || "";
    const categoryDescription: string = $script.getAttribute("data-cc-category-description")?.trim() || "";

    if (!isAttributeValid(categoryName)) {
      console.error(`Name is missing on: ${$script.outerHTML}`);
      continue; // Next
    }

    // Before creating the category, category-name and category-description must not be empty
    let category: Category =
      categories.get(categoryName) !== undefined ? categories.get(categoryName)! : new Category(categoryName, categoryDescription);

    // Cookie
    const cookieName: string = $script.getAttribute("data-cc-name")?.trim() || "";
    const cookieDescription: string = $script.getAttribute("data-cc-description")?.trim() || "";
    const cookieDomain: string = $script.getAttribute("data-cc-domain")?.trim() || "";
    const cookieRevocable: boolean = $script.hasAttribute("data-cc-revocable");
    const cookieTokensStr: string = $script.getAttribute("data-cc-tokens") || "";
    let tokens: string[] = [];

    if (isAttributeValid(cookieTokensStr)) {
      tokens = cookieTokensStr.split(",").map((token) => token.trim());
    }

    const cookie: Cookie | undefined = category.getCookie(cookieName);

    if (!cookie) {
      category.addCookie({
        name: cookieName,
        description: cookieDescription,
        domain: cookieDomain,
        tokens: tokens,
        scripts: [$script],
        revocable: cookieRevocable,
      });
    } else {
      cookie.addScripts([$script]);
      cookie.addTokens(tokens);
    }

    categories.set(categoryName, category);
  }

  return categories;
}

export class CookieConsent {
  public get locale(): LanguageCode {
    return this.#locale;
  }

  public set locale(value: LanguageCode) {
    this.#locale = value;
    // Todo trigger UI to render?
  }

  get categories(): Map<string, Category> {
    return this._categories;
  }

  get card(): HTMLDivElement {
    return this.UI.card;
  }

  get version(): number {
    return this.#version;
  }

  #version: number;
  #locale: LanguageCode;
  #focusTrap: FocusTrap;
  #cookieToken: string = "_cookie_consent";
  #translations: {[key in LanguageCode]?: ConsentMessages} = messages;
  private config: ConsentConfig;
  private needToReload: Boolean;
  private readonly UI: UI;
  private _categories: Map<string, Category>;
  private dispatcher: EventDispatcher = EventDispatcher.getInstance();

  constructor(config: ConsentConfig) {
    this.config = config;
    this.#locale = this.config.locale;
    this.#version = this.config.version || 1;
    this.needToReload = this.config.forceToReload || false;
    this._categories = this.config.categories ? arrayToMap<Category>(this.config.categories, "name") : new Map();
    this.UI = new UI(messages[LanguageCode.Fr] as ConsentMessages);
    this.#focusTrap = new FocusTrap(this.UI.card);

    if (this.#translations[this.#locale]) {
      this.UI.updateMessages(this.#translations[this.#locale] as ConsentMessages);
    }

    if (this.categories.size > 0) {
      this.setup();
    }

    return this;
  }

  /**
   * @param {(messages: ConsentMessages) => void} cb
   * @returns {this}
   */
  setMessages(cb: (messages: ConsentMessages) => void) {
    try {
      cb.call(null, this.UI.messages);
    } catch (error: any) {
      if (error instanceof Error) {
        console.error(error.name, error.message);
      }
    }
    return this;
  }

  /*createMessagesObj(): ConsentMessages {
    let consentMessages: ConsentMessages = {
      // categories: {} as { [key: string]: CategoryTranslation },
      close_preferences: "",
      continue_without_accepting: "",
      description: "",
      open_preferences: "",
      reject: "",
      save: "",
      accept_all: "",
      title: "",
    };

    /!*if (consentMessages.categories) {
      for (const [categoryName, category] of this._categories) {
        const categoryNameToken: string = strToId(categoryName);
        consentMessages.categories[categoryNameToken] = {
          name: categoryName,
          description: category.description,
          cookies: {},
        } as CategoryTranslation;

        for (const [cookieName, cookie] of category.cookies) {
          const cookieNameToken: string = strToId(cookieName);

          consentMessages.categories[categoryNameToken].cookies![cookieNameToken] = {
            name: cookieName,
            description: cookie.description,
          };
          Object.preventExtensions(consentMessages.categories[categoryNameToken].cookies![cookieNameToken]);
        }

        Object.preventExtensions(consentMessages.categories[categoryNameToken]);
      }
    }*!/

    Object.preventExtensions(consentMessages);
    // Object.preventExtensions(consentMessages.categories);
    return consentMessages;
  }*/

  setup() {
    // Parse script tags and get config from them
    const categoriesFromScriptTags: Map<string, Category> = createCategoriesFromScriptTags('script[type="cookie-consent"]');

    // Merge config categories to categoriesFromScriptTags
    for (const [categoryName, category] of this._categories) {
      const existingCategoryFST: Category | undefined = categoriesFromScriptTags.get(categoryName);
      // The category already exists so add or merge...
      if (existingCategoryFST) {
        // loop cookies
        for (const [cookieName, cookie] of category.cookies) {
          const existingCookie: Cookie | undefined = existingCategoryFST.cookies.get(cookieName);
          if (existingCookie) {
            existingCookie.addScripts(cookie.scripts);
            existingCookie.addTokens(cookie.tokens);
          } else {
            existingCategoryFST.cookies.set(cookieName, cookie);
          }
        }
      } else {
        // Add the new category
        categoriesFromScriptTags.set(categoryName, category);
      }
    }

    this._categories = categoriesFromScriptTags;
    this.updateFromStorage();

    if (typeof this.config.messages === "function") {
      try {
        this.UI.messages = this.config.messages.call(null, this.#translations[this.locale] as ConsentMessages); // provide an empty consentMessages obj
      } catch (error: any) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
    }

    // Events
    this.UI.card.addEventListener(ConsentEvent.Change, (e: any) => {
      const cookieChanged: Cookie = e.detail.cookie;
      const category: Category | undefined = this._categories.get(cookieChanged.categoryName);

      if (category) {
        const cookie: Cookie | undefined = category.cookies.get(cookieChanged.name);
        if (cookie) {
          if (!this.needToReload) this.needToReload = !e.detail.input.checked && cookie.isEnabled;
          cookie.accepted = e.detail.input.checked;
        }
      }
    });

    this.dispatcher.addListener(ConsentEvent.Save, async () => {
      await this.update(ConsentEvent.Save);
      this.hide();
    });

    this.dispatcher.addListener(ConsentEvent.AcceptAll, async () => {
      await this.update(ConsentEvent.AcceptAll);
      this.hide();
    });

    this.dispatcher.addListener(ConsentEvent.Reject, async () => {
      await this.update(ConsentEvent.Reject);
      this.hide();
    });

    this.enableSelected().then(() => {
      this.UI.render(categoriesFromScriptTags).then((card) => {
        document.body.appendChild(card);
      });
    });
  }

  show() {
    this.UI.card.style.display = "block";
    this.UI.card.removeAttribute("hidden");
    this.UI.card.setAttribute("aria-hidden", "false");
    this.UI.card.setAttribute("tabindex", "0");
    this.#focusTrap.listen();
    this.dispatcher.dispatch(ConsentEvent.Show);
  }

  hide() {
    this.UI.card.setAttribute("hidden", "hidden");
    this.UI.card.style.display = "none";
    this.UI.card.setAttribute("aria-hidden", "true");
    this.UI.card.setAttribute("tabindex", "-1");
    this.#focusTrap.dispose();
  }

  onShow(callback: (card: HTMLDivElement, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.Show, () => callback.call(null, this.card, this));
  }

  onHide(callback: (card: HTMLDivElement, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.Hide, () => callback.call(null, this.card, this));
  }

  onSave(callback: (consent: DeserializedConsent, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.Save, () => callback.call(null, this.deserializeConsent(), this));
  }

  onAcceptAll(callback: (consent: DeserializedConsent, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.AcceptAll, () => callback.call(null, this.deserializeConsent(), this));
  }

  onReject(callback: (consent: DeserializedConsent, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.Reject, () => callback.call(null, this.deserializeConsent(), this));
  }

  onChange(callback: (consent: DeserializedConsent, input: HTMLInputElement, cookie: Cookie, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.Change, (...args: [HTMLInputElement, Cookie]) => {
      callback.call(null, this.deserializeConsent(), ...args, this);
    });
  }

  onOpenParams(callback: (card: HTMLDivElement, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.OpenParams, () => {
      callback.call(null, this.card, this);
    });
  }

  onCloseParams(callback: (card: HTMLDivElement, cookieConsent?: CookieConsent) => void) {
    this.dispatcher.addListener(ConsentEvent.CloseParams, () => {
      callback.call(null, this.card, this);
    });
  }

  private async update(eventName: ConsentEvent): Promise<void> {
    switch (eventName) {
      case ConsentEvent.Save:
        await this.enableSelected();
        break;
      case ConsentEvent.AcceptAll:
        await this.enableAll(true);
        this.UI.update(this._categories);
        break;
      case ConsentEvent.Reject:
        await this.enableAll(false).then(() => {
          this.UI.update(this._categories);
        });
        break;
    }

    // Set consent cookie
    this.save();

    if (this.config.forceToReload || this.needToReload) {
      window.location.reload();
      this.needToReload = false;
    }
  }

  private updateFromStorage() {
    const consentSaved: DeserializedConsent | undefined = this.deserializeConsent();
    if (consentSaved === undefined) {
      this.show();
      return;
    }

    // Show the consent card if versions don't match
    if (consentSaved.version !== this.version) {
      this.enableAll(false).then(() => {
        this.show();
      });
    } else {
      consentSaved?.cookies.forEach((item) => {
        const category: Category | undefined = this.categories.get(item.categoryName);
        const cookie: Cookie | undefined = category?.cookies.get(item.name);
        if (cookie && cookie.isRevocable) {
          cookie.accepted = item.accepted;
        }
      });
    }
  }

  /**
   * Call on ConsentEvent.AcceptAll
   * Set all cookies accepted at true
   */
  private enableAll(value: boolean): Promise<void[]> {
    let cookiePromises: Promise<void>[] = [];
    this._categories.forEach((category: Category) => {
      category.cookies.forEach((cookie) => {
        if (cookie.isRevocable) {
          if (cookie.isAccepted && !value) this.needToReload = true;
          cookie.accepted = value;
          if (value) {
            cookiePromises.push(cookie.enable());
          } else {
            cookiePromises.push(cookie.disable());
          }
        }
      });
    });

    return Promise.all(cookiePromises);
  }

  private enableSelected(): Promise<void[]> {
    let cookiePromises: Promise<void>[] = [];

    this._categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        if (cookie.isRevocable && cookie.isAccepted) {
          cookiePromises.push(cookie.enable());
        } else {
          cookiePromises.push(cookie.disable());
        }
      });
    });
    return Promise.all(cookiePromises);
  }

  private save() {
    let expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 11);
    document.cookie = `${this.#cookieToken}=${this.serializeConsent()}; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax;`;
  }

  /**
   * Stringify userConsent
   * @private
   */
  private serializeConsent(): string {
    let consent: DeserializedConsent = {
      version: this.config.version,
      cookies: [],
    };

    this._categories.forEach(function (category: Category) {
      category.cookies.forEach((cookie, cookieName) => {
        consent.cookies.push({
          categoryName: category.name,
          name: cookieName,
          accepted: cookie.isAccepted,
          isRevocable: cookie.isRevocable,
        });
      });
    });

    return JSON.stringify(consent);
  }

  private deserializeConsent() {
    const consentSaved: string | undefined = getCookieValue(this.#cookieToken);
    if (consentSaved) {
      return JSON.parse(consentSaved);
    }
  }

  async removeConsent(): Promise<void> {
    const expireDate = new Date("1970");
    let domain: string = location.hostname.replace("www", "");
    document.cookie = `${this.#cookieToken}=; expires=${expireDate.toUTCString()}; Domain=${domain}; Max-Age=0; path=/;`;
    await this.enableAll(false);
  }
}
