import { LanguageCode } from "./Translations.ts";
import { Category } from "./Category.ts";
import { DeserializedConsent, Store } from "./Store.ts";
import { arrayToMap, isAttributeValid } from "./utils.ts";
import { Cookie } from "./Cookie.ts";
import { CardElement, CardMessages } from "./ui/CardElement.ts";
import EventDispatcher, { ConsentEvent } from "./EventDispatcher.ts";
import { hideElement, showElement } from "./ui/helpers.ts";
import FocusTrap from "./FocusTrap.ts";

export interface CookieConsentConfig {
  locale: LanguageCode | string;
  version?: string;
  forceToReload?: boolean; // Force to reload on any changes when the user save his consent.
  categories?: Category[];
  translations?: { [key in LanguageCode]?: CardMessages };
  onSave?: (config: CookieConsentConfig) => void;
  onReject?: (config: CookieConsentConfig) => void;
}

export class CookieConsent {
  set locale(value: LanguageCode | string) {
    this.#locale = value.toLowerCase();
    this.updateMessages();
  }

  #cookieKey: string = "_cc_consent";
  #locale: LanguageCode | string;
  #version: string; // "ex: 1.0.0"
  #forceToReload: boolean;
  #categories: Map<string, Category>;
  #translations: { [key in LanguageCode | string]?: CardMessages };
  #store: Store = new Store(this.#cookieKey);
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();
  #card: CardElement = new CardElement();
  #focusTrap: FocusTrap;

  constructor(config: CookieConsentConfig) {
    this.#locale = config.locale;
    this.#version = config?.version || "1.0.0";
    this.#forceToReload = config?.forceToReload || false;
    this.#categories = config?.categories ? arrayToMap<Category>(config.categories, "name") : new Map();
    this.#translations = config?.translations || {};
    this.#focusTrap = new FocusTrap(this.#card.$el);

    this.setup();
    this.addListeners();
    this.render();
    this.updateMessages();
    this.checkConsentSaved();
  }

  setup() {
    const categoriesFromScriptTags: Map<string, Category> = this.createCategoriesFromScriptTags('script[type="cookie-consent"]');
    // Merge config categories to categoriesFromScriptTags
    for (const [categoryName, category] of this.#categories) {
      const existingCategoryFST: Category | undefined = categoriesFromScriptTags.get(categoryName);
      // The category already exists so merge...
      if (existingCategoryFST) {
        existingCategoryFST.addTranslations(category.translations);
        // loop cookies
        for (const [cookieName, cookie] of category.cookies) {
          const existingCookie: Cookie | undefined = existingCategoryFST.cookies.get(cookieName);
          if (existingCookie) {
            existingCookie.addTranslations(cookie.translations);
            existingCookie.addScripts(cookie.scripts);
            existingCookie.addTokens(cookie.tokens);
            // If the description from the script tag is empty, replace it with the description of the cookie created in JavaScript, provided that
            // it is not empty either.
            if (existingCookie.description.length === 0 && cookie.description.length !== 0) {
              existingCookie.description = cookie.description;
            }
          } else {
            existingCategoryFST.cookies.set(cookieName, cookie);
          }
        }
      } else {
        // Add the new category
        categoriesFromScriptTags.set(categoryName, category);
      }
    }

    this.#categories = categoriesFromScriptTags;
  }

  checkConsentSaved() {
    const consentSaved: DeserializedConsent | undefined = this.#store.deserialize();
    if (consentSaved) {
      // Check version before show the card
      if (this.#version !== consentSaved.version) {
        // Show the card
        this.show();
        showElement(this.#card.$version);
      }
      consentSaved.cookies.forEach((cookie) => {
        const c: Cookie | undefined = this.#categories.get(cookie.categoryName)?.cookies.get(cookie.name);
        if (c) {
          c.accepted = cookie.isAccepted;
          if (cookie.isAccepted) {
            (async () => c.enable())();
          }
        }
      });
    } else {
      this.show();
    }
  }

  private addListeners() {
    this.#dispatcher.addListener(ConsentEvent.OpenSettings, this.onOpenSettings.bind(this));
    this.#dispatcher.addListener(ConsentEvent.CloseSettings, this.onCloseSettings.bind(this));
    this.#dispatcher.addListener(ConsentEvent.CookieChange, this.onCookieChange.bind(this));
    this.#dispatcher.addListener(ConsentEvent.Reject, this.onReject.bind(this));
    this.#dispatcher.addListener(ConsentEvent.AcceptAll, this.onAcceptAll.bind(this));
    this.#dispatcher.addListener(ConsentEvent.Save, this.onSave.bind(this));
  }

  private onOpenSettings() {
    // Open first category or already open
    const $firstCategoryContent: HTMLDivElement | null = this.#card.$el.querySelector(".cc_category .cc_category_content");
    if ($firstCategoryContent !== null) {
      showElement($firstCategoryContent);
      // Add focus on first category's cookie
      const $firstCookieInput: HTMLInputElement | null = $firstCategoryContent.querySelector('.cc_cookie input[type="checkbox"]');
      if ($firstCookieInput !== null) {
        $firstCookieInput.focus();
      }
    }
    // Show btnSave
    showElement(this.#card.btnSave);
    hideElement(this.#card.btnAcceptAll);
  }

  private onCloseSettings() {
    const $categoriesContent: NodeListOf<HTMLDivElement> | null = this.#card.$el.querySelectorAll(".cc_category .cc_category_content");
    if ($categoriesContent) {
      for (const $categoriesContentElement of $categoriesContent) {
        hideElement($categoriesContentElement);
      }
    }
    // Hide btnSave
    hideElement(this.#card.btnSave);
    showElement(this.#card.btnAcceptAll);
  }

  /**
   * Save cookie consent into "document.cookie" with an expiration date: currentMonth + 11
   * @private
   */
  private async onSave() {
    try {
      this.saveUserConsent();
      await this.toggleCookies(); // Enable/Disable cookies
      // Reload the webpage if wanted
      if (this.#forceToReload) {
        window.location.reload();
      }
      this.hide();
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  }

  private onReject() {
    const cookiesDisablingPromises: Promise<void>[] = [];
    this.#categories.forEach((category) => {
      category.cookies.forEach((cookie) => {
        if (cookie.isEnabled) this.#forceToReload = true;
        cookie.accepted = false;
        cookiesDisablingPromises.push(cookie.disable());
      });
    });

    (async () => {
      try {
        await Promise.all(cookiesDisablingPromises);
        this.saveUserConsent();
        if (this.#forceToReload) {
          window.location.reload();
        }
      } catch (error) {
        console.error("An error occurred:", error);
      }
    })();
  }

  private async onAcceptAll(): Promise<void> {
    try {
      await this.enableAllCookies();
      this.saveUserConsent();
      this.hide();
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
  }

  private onCookieChange() {
    this.#store.data = { version: this.#version, categories: this.#categories };
  }

  private createCategoriesFromScriptTags(selector: string): Map<string, Category> {
    let categories: Map<string, Category> = new Map();
    const $scripts: HTMLScriptElement[] = Array.from(document.querySelectorAll<HTMLScriptElement>(selector));

    for (const $script of $scripts) {
      // Get the category name and description
      const categoryName: string = $script.getAttribute("data-cc-category-name")?.trim() || "";
      const categoryDescription: string = $script.getAttribute("data-cc-category-description")?.trim() || "";

      // If the name is missing, the script tag will not be processed.
      if (!isAttributeValid(categoryName)) {
        console.error(`Name is missing on: ${$script.outerHTML} is ignored.`);
        // Go to the next script tag
        continue;
      }

      // Retrieve category or creating a new one
      let category: Category =
        categories.get(categoryName) !== undefined
          ? categories.get(categoryName)!
          : new Category({
              name: categoryName,
              description: categoryDescription,
              cookies: new Map(),
            });

      // Retrieve data need to create a Cookie later
      const cookieName: string = $script.getAttribute("data-cc-name")?.trim() || "";
      const cookieDescription: string = $script.getAttribute("data-cc-description")?.trim() || "";
      const cookieDomain: string = $script.getAttribute("data-cc-domain")?.trim() || "";
      const cookieRevocable: boolean = $script.hasAttribute("data-cc-revocable");
      const cookieTokensStr: string = $script.getAttribute("data-cc-tokens") || "";

      // Parse tokens
      let tokens: string[] = [];
      if (isAttributeValid(cookieTokensStr)) {
        tokens = cookieTokensStr.split(",").map((token) => token.trim());
      }

      // Getting cookie or not...
      const cookie: Cookie | undefined = category.cookies.get(cookieName);

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

  private render() {
    // Create category
    this.#categories.forEach((category) => {
      this.#card.addCategory(category.element);
      // Cookie elements
      category.cookies.forEach((cookie) => {
        category.element.addCookieElement(cookie.element);
      });
    });

    // Set messages into html elements
    document.body.appendChild(this.#card.$el);
  }

  private saveUserConsent() {
    this.#store.data = {
      version: this.#version,
      categories: this.#categories,
    };
    let expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 11);
    document.cookie = `${this.#cookieKey}=${this.#store.serialize()}; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax;`;
  }

  /**
   * Enable or disable cookie
   * @returns {Promise<void[]>}
   * @private
   */
  private toggleCookies(): Promise<void[]> {
    let cookiePromises: Promise<void>[] = [];

    this.#categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        if (cookie.isRevocable && cookie.isAccepted && !cookie.isEnabled) {
          cookiePromises.push(cookie.enable());
        } else {
          // If the cookie was previously accepted and enabled refresh, we need to reload to make the changes
          cookiePromises.push(cookie.disable());
          if (!this.#forceToReload) this.#forceToReload = true;
        }
      });
    });
    return Promise.all(cookiePromises);
  }

  enableAllCookies() {
    let cookiePromises: Promise<void>[] = [];

    this.#categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        if (cookie.isRevocable) {
          cookie.accepted = true;
          cookiePromises.push(cookie.enable());
        }
      });
    });

    return Promise.all(cookiePromises);
  }

  updateMessages() {
    // Update Card messages
    if (this.#translations.hasOwnProperty(this.#locale)) {
      this.#card.updateMessages(<CardMessages>this.#translations[this.#locale]);
    }
    // Update categories messages
    this.#categories.forEach((category) => {
      if (category.translations.hasOwnProperty(this.#locale)) {
        category.element.updateMessages(<{ name: string; description: string }>category.translations[this.#locale]);
      }

      // Update cookies messages
      category.cookies.forEach((cookie) => {
        if (cookie.translations.hasOwnProperty(this.#locale)) {
          cookie.element.updateMessages(<{ name: string; description: string }>category.translations[this.#locale]);
        }
      });
    });
  }

  show() {
    showElement(this.#card.$el);
    this.#focusTrap.updateTargets();
    this.#focusTrap.firstTarget?.focus();
    this.#focusTrap.listen();
  }

  hide() {
    hideElement(this.#card.$el);
    this.#focusTrap.dispose();
  }
}
