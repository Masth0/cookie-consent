import { Category } from "./Category.ts";
import { arrayToMap, getCookieValue, isAttributeValid, strToId } from "./utils.ts";
import { Cookie } from "./Cookie.ts";
import { UI, UIEvent } from "./UI.ts";
import { CategoryTranslation, ConsentMessages } from "./Translations.ts";
import FocusTrap from "./FocusTrap.ts";

export interface ConsentConfig {
  version: number;
  forceToReload: boolean; // Force to reload on any changes when the user save his consent.
  categories: Category[];
  onSave?: (config: ConsentConfig) => void;
  onReject?: (config: ConsentConfig) => void;
  messages?: (messages: ConsentMessages) => ConsentMessages;
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
  get categories(): Map<string, Category> {
    return this._categories;
  }

  get card(): HTMLDivElement {
    return this.UI.card;
  }

  get version(): number {
    return this.config.version;
  }

  #focusTrap: FocusTrap;
  #cookieToken: string = "_cookie_consent";
  private config: ConsentConfig;
  private needToReload: Boolean;
  private readonly UI: UI;
  private _categories: Map<string, Category>;

  constructor(config: ConsentConfig) {
    this.config = config;
    this.needToReload = config.forceToReload;
    this._categories = arrayToMap<Category>(this.config.categories, "name");
    this.UI = new UI(this.createMessagesObj()); //TODO provide pre-filled messages for many locales like fr, de, en
    this.#focusTrap = new FocusTrap(this.UI.card);
    this.setup();
    // this.show();

    return this;
  }

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

  createMessagesObj(): ConsentMessages {
    let consentMessages: ConsentMessages = {
      categories: {} as { [key: string]: CategoryTranslation },
      close_preferences: "",
      continue_without_accepting: "",
      description: "",
      open_preferences: "",
      reject: "",
      save: "",
      save_all: "",
      title: "",
    };

    for (const [categoryName, category] of this._categories) {
      const categoryNameToken: string = strToId(categoryName);
      consentMessages.categories[categoryNameToken] = {
        name: categoryName,
        description: category.description,
        cookies: {},
      } as CategoryTranslation;

      for (const [cookieName, cookie] of category.cookies) {
        const cookieNameToken: string = strToId(categoryName);

        consentMessages.categories[categoryNameToken].cookies![cookieNameToken] = {
          name: cookieName,
          description: cookie.description,
        };
        Object.preventExtensions(consentMessages.categories[categoryNameToken].cookies![cookieNameToken]);
      }

      Object.preventExtensions(consentMessages.categories[categoryNameToken]);
    }

    Object.preventExtensions(consentMessages);
    Object.preventExtensions(consentMessages.categories);
    return consentMessages;
  }

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
        this.UI.messages = this.config.messages.call(null, this.createMessagesObj());
      } catch (error: any) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
    }

    // Events
    this.UI.card.addEventListener(UIEvent.Change, (e: any) => {
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

    this.UI.card.addEventListener(UIEvent.Save, async () => {
      await this.update(UIEvent.Save);
      this.hide();
    });

    this.UI.card.addEventListener(UIEvent.AcceptAll, async () => {
      await this.update(UIEvent.AcceptAll);
      this.hide();
    });

    this.UI.card.addEventListener(UIEvent.Reject, async () => {
      await this.update(UIEvent.Reject);
      this.hide();
    });

    this.enableSelected().then(() => {
      this.UI.render(categoriesFromScriptTags).then((card) => {
        document.body.appendChild(card);
      });
    });
  }

  show() {
    console.log('show');
    this.UI.card.style.display = "";
    this.UI.card.removeAttribute("hidden");
    this.UI.card.setAttribute("aria-hidden", "false");
    this.UI.card.setAttribute("tabindex", "0");
    this.#focusTrap.listen();
  }

  hide() {
    this.UI.card.setAttribute("hidden", "hidden");
    this.UI.card.style.display = "none";
    this.UI.card.setAttribute("aria-hidden", "true");
    this.UI.card.setAttribute("tabindex", "-1");
    this.#focusTrap.dispose();
  }

  private async update(eventName: UIEvent): Promise<void> {
    switch (eventName) {
      case UIEvent.Save:
        await this.enableSelected();
        break;
      case UIEvent.AcceptAll:
        await this.enableAll(true);
        this.UI.update(this._categories);
        break;
      case UIEvent.Reject:
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
   * Call on UIEvent.AcceptAll
   * Set all cookies accepted at true
   * @param value
   * @private
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
