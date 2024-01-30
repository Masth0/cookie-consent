import {checkLanguageCode, LanguageCode, ScriptTagTranslations} from "./Translations.ts";
import {Category, CategoryTranslations} from "./Category.ts";
import {DeserializedConsent, Store} from "./Store.ts";
import {arrayToMap, checkRequiredTagAttributes, isAttributeValid} from "./utils.ts";
import {Cookie, CookieConfig, CookieTranslations} from "./Cookie.ts";
import {CardElement, CardMessages} from "./ui/CardElement.ts";
import EventDispatcher, {ConsentEvent, EventDataCookieEdition} from "./EventDispatcher.ts";
import {hideElement, showElement, strToId} from "./ui/helpers.ts";
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

export enum ScriptTagAttributes {
  CategoryName = "data-cc-category-name",
  CategoryDescription = "data-cc-category-description",
  CookieName = "data-cc-name",
  CookieDescription = "data-cc-description",
  CookieDomain = "data-cc-domain",
  CookieTokens = "data-cc-tokens",
  Translations = "data-cc-translations",
  Revocable = "data-cc-revocable",
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
    const categoriesFromScriptTags: Map<string, Category> = this.createCategoriesFromScriptTags(
      'script[type="cookie-consent"], iframe[data-cc-name]',
    );
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

    this.#dispatcher.addListener(ConsentEvent.Show, this.onShow.bind(this));
  }

  private onOpenSettings(cookieEditionData?: EventDataCookieEdition) {
    // Check according cookie in cookieEditionData
    if (cookieEditionData !== undefined) {
      const category: Category|undefined = this.#categories.get(cookieEditionData.categoryName);
      const cookie: Cookie | undefined = category?.cookies.get(cookieEditionData.cookieName);
      category?.element.open();
      cookie?.element.setChecked(true);
    } else {
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
    }
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
        this.hide();
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
      this.hide();
      await this.enableAllCookies();
      this.saveUserConsent();
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
  }

  private onCookieChange() {
    this.#store.data = { version: this.#version, categories: this.#categories };
  }

  private onShow(cookieEditionData?: EventDataCookieEdition) {
    console.log("DATA onShow -> ", cookieEditionData);
    if (cookieEditionData !== undefined) {
      console.log(`cc_category_${strToId(cookieEditionData.categoryName)}`);
      console.log(`cc_cookie_${strToId(cookieEditionData.cookieName)}`);
      // Open settings -> category and focus the cookie
      this.#card.openSettings(cookieEditionData);
    }
    this.show(this.#card.btnSave);
  }

  private createCategoriesFromScriptTags(selector: string): Map<string, Category> {
    let categories: Map<string, Category> = new Map();
    const $scripts: (HTMLScriptElement | HTMLIFrameElement)[] = Array.from(
      document.querySelectorAll<HTMLScriptElement | HTMLIFrameElement>(selector),
    );

    for (const $script of $scripts) {
      if ($script.tagName === "IFRAME") console.log($script);
      // First check if the script tag has all attributes required before to do anything
      // If the script tag is not eligible skip it and go to the following
      if (!checkRequiredTagAttributes($script)) {
        console.error($script, `Required attributes (${ScriptTagAttributes.CategoryName}, ${ScriptTagAttributes.CookieName}) are missing`);
        continue;
      }

      // Get the category name and description
      const categoryName: string = $script.getAttribute(ScriptTagAttributes.CategoryName)?.trim() as string;
      const categoryDescription: string = $script.getAttribute(ScriptTagAttributes.CategoryDescription)?.trim() || "";

      // Retrieve category by name or creating a new one
      let category: Category =
        categories.get(categoryName) !== undefined
          ? categories.get(categoryName)!
          : new Category({
              name: categoryName,
              description: categoryDescription,
              cookies: new Map(),
            });

      // Translations
      // Check languageCode, name and description
      let scriptTranslations: { [key: LanguageCode | string]: ScriptTagTranslations } | undefined = undefined;
      if ($script.dataset.ccTranslations && isAttributeValid($script.dataset.ccTranslations)) {
        try {
          scriptTranslations = JSON.parse($script.dataset.ccTranslations);
          for (const transKey in scriptTranslations) {
            // Uppercase the first char
            const key = transKey.charAt(0).toUpperCase() + transKey.slice(1);
            checkLanguageCode(key);
          }
        } catch (e) {
          if (e instanceof Error) {
            console.error(e.message);
          }
        }
      }

      // Make CategoryTranslations
      let categoryTranslations: CategoryTranslations = {};
      let cookieTranslations: CookieTranslations = {};
      for (const transKey in scriptTranslations) {
        if (scriptTranslations[transKey].categoryName && scriptTranslations[transKey].categoryDescription) {
          categoryTranslations[transKey] = {
            name: scriptTranslations[transKey].categoryName,
            description: scriptTranslations[transKey].categoryDescription,
          };
        }
        // Cookie translations
        if (scriptTranslations[transKey].cookieName && scriptTranslations[transKey].cookieDescription) {
          cookieTranslations[transKey] = {
            name: scriptTranslations[transKey].cookieName,
            description: scriptTranslations[transKey].cookieDescription,
          };
        }
      }
      category.addTranslations(categoryTranslations);

      // Retrieve data need to create a Cookie later
      const cookieName: string = $script.getAttribute(ScriptTagAttributes["CookieName"])?.trim() || "";
      const cookieDescription: string = $script.getAttribute(ScriptTagAttributes["CookieDescription"])?.trim() || "";
      const cookieDomain: string = $script.getAttribute(ScriptTagAttributes["CookieDomain"])?.trim() || "";
      const cookieRevocable: boolean = $script.hasAttribute(ScriptTagAttributes["Revocable"]);
      const cookieTokensStr: string = $script.getAttribute(ScriptTagAttributes["CookieTokens"]) || "";

      // Parse tokens
      let tokens: string[] = [];
      if (isAttributeValid(cookieTokensStr)) {
        tokens = cookieTokensStr.split(",").map((token) => token.trim());
      }

      // Getting cookie or not...
      console.log("Cookie translations ", cookieTranslations);
      const cookie: Cookie | undefined = category.cookies.get(cookieName);
      let cookieConfig: CookieConfig;
      if (!cookie) {
        cookieConfig = {
          name: cookieName,
          description: cookieDescription,
          domain: cookieDomain,
          tokens: tokens,
          revocable: cookieRevocable,
          translations: cookieTranslations,
        };

        if ($script.tagName === "IFRAME") {
          cookieConfig.iframes = [<HTMLIFrameElement>$script];
          // Todo add IframePlaceholderMessages
          // Merge Iframe translations with cookie translations
        } else {
          cookieConfig.scripts = [<HTMLScriptElement>$script];
        }
        category.addCookie(cookieConfig);
      } else {
        if ($script.tagName === "IFRAME") {
          cookie.addIframes([<HTMLIFrameElement>$script]);
          // Todo add IframePlaceholderMessages
        } else {
          cookie.addScripts([<HTMLScriptElement>$script]);
        }
        cookie.addTokens(tokens);
        cookie.addTranslations(cookieTranslations);
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
    let cookiePromises: {func: () => void}[] = [];

    this.#categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        
        console.log(cookie.name, cookie.isRevocable && cookie.isAccepted && cookie.isEnabled);
        if (cookie.isRevocable && cookie.isAccepted && !cookie.isEnabled) {
          cookiePromises.push({func: cookie.enable.bind(cookie)});
        }
        console.log(cookie.name, cookie.isRevocable && cookie.isAccepted && cookie.isEnabled);

        if (cookie.isRevocable && cookie.isAccepted && cookie.isEnabled) {
          // If the cookie was previously accepted, we need to reload to make the changes
          console.log('Cookie ', cookie.isEnabled, cookie);
          cookiePromises.push({func: cookie.disable.bind(cookie)});
          if (!this.#forceToReload) this.#forceToReload = true;
        }
        
      });
    });
    return Promise.all(cookiePromises.map((cp) => cp.func()));
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
      this.#card.setMessages(<CardMessages>this.#translations[this.#locale]);
    }
    // Update categories messages
    this.#categories.forEach((category) => {
      if (category.translations.hasOwnProperty(this.#locale)) {
        category.element.setMessages(<{ name: string; description: string }>category.translations[this.#locale]);
      } else {
        // If translation isn't present take name and description from new instance params, new Category([name], [description]...)
        category.element.setMessages({ name: category.name, description: category.description });
      }

      // Update cookies messages
      category.cookies.forEach((cookie) => {
        if (cookie.translations.hasOwnProperty(this.#locale)) {
          cookie.element.setMessages(<{ name: string; description: string }>cookie.translations[this.#locale]);
        }
        if (cookie.translations[this.#locale]?.hasOwnProperty("iframePlaceholder")) {
          cookie.iframePlaceholderElement?.setMessages(
            <
              {
                message: string;
                btnLabel: string;
              }
            >cookie.translations[this.#locale]?.iframePlaceholder,
          );
        }
      });
    });
  }

  show(elementToFocused?: HTMLElement) {
    showElement(this.#card.$el);
    this.#focusTrap.updateTargets();
    if (elementToFocused) {
      this.#focusTrap.focus(elementToFocused);
    } else {
      this.#focusTrap.firstTarget?.focus();
    }
    this.#focusTrap.listen();
  }

  hide() {
    hideElement(this.#card.$el);
    this.#focusTrap.dispose();
  }
}