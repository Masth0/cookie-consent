import { Category } from "./Category.ts";
import { Cookie } from "./Cookie.ts";
import { ConsentMessages, LanguageCode } from "./Translations.ts";
import { strToId } from "./utils.ts";
import EventDispatcher, { ConsentEvent } from "./EventDispatcher.ts";

const FADE_IN_ANIMATION_TOKEN: string = "cc-open-animation";
const ANIMATION_DISABLED_CLASS: string = "cc-animation-disabled";
const IS_OPEN_CLASS: string = "cc-is-open";

function createHTMLElement<T extends HTMLElement>(tag: string, attr: { [key: string]: string }): T {
  const el = <T>document.createElement(tag);

  for (const elKey in attr) {
    el.setAttribute(elKey, attr[elKey]);
  }

  return el;
}

/**
 * Used to add eventListener
 */
enum DatasetActionUI {
  Save = "data-cc-save",
  SaveAll = "data-cc-save-all",
  Reject = "data-cc-reject",
  Params = "data-cc-params",
}

export class UI {
  get messages(): ConsentMessages | undefined {
    return this.#messages;
  }

  /*set messages(value: ConsentMessages) {
    this.#messages = value;
    this.updateMessages(this.messages);
  }*/

  card: HTMLDivElement;
  topBar: HTMLDivElement;
  header: HTMLDivElement;
  body: HTMLDivElement;
  footer: HTMLDivElement;
  btnContinueWithoutAccepting: HTMLButtonElement;
  btnReject: HTMLButtonElement;
  btnAcceptAll: HTMLButtonElement;
  btnSave: HTMLButtonElement;
  btnParams: HTMLButtonElement;
  title: HTMLParagraphElement;
  description: HTMLParagraphElement;
  versionInfo: HTMLParagraphElement;

  #messages: ConsentMessages | undefined;
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();

  constructor() {
    this.card = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_card",
      "aria-hidden": "true",
      hidden: "hidden",
      tabindex: "-1",
    });
    this.topBar = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_topbar",
    });
    this.header = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_header",
    });
    this.versionInfo = createHTMLElement<HTMLParagraphElement>("p", {
      class: "cc_card_version_info",
      "aria-hidden": "true",
      hidden: "hidden",
    });
    this.title = createHTMLElement<HTMLParagraphElement>("p", {
      class: "cc_card_title",
    });
    this.description = createHTMLElement<HTMLParagraphElement>("p", {
      class: "cc_card_description",
    });
    this.body = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_body",
      hidden: "hidden",
    });
    this.footer = createHTMLElement("div", {
      class: "cc_footer",
    });
    this.btnContinueWithoutAccepting = createHTMLElement("button", {
      type: "button",
      class: "cc_btn",
      [DatasetActionUI.Reject]: "",
    });
    this.btnReject = createHTMLElement("button", {
      type: "button",
      class: "cc_btn",
      [DatasetActionUI.Reject]: "",
    });
    this.btnSave = createHTMLElement("button", {
      type: "button",
      class: "cc_btn",
      hidden: "hidden",
      [DatasetActionUI.Save]: "",
    });
    this.btnAcceptAll = createHTMLElement("button", {
      type: "button",
      class: "cc_btn",
      [DatasetActionUI.SaveAll]: "",
    });
    this.btnParams = createHTMLElement("button", {
      type: "button",
      class: "cc_btn",
      [DatasetActionUI.Params]: "",
    });

    /* Topbar */
    this.topBar.appendChild(this.btnContinueWithoutAccepting);
    /* Header */
    this.header.appendChild(this.title);
    this.header.appendChild(this.versionInfo);
    this.header.appendChild(this.description);
    /* Footer */
    this.footer.appendChild(this.btnParams);
    this.footer.appendChild(this.btnReject);
    this.footer.appendChild(this.btnSave);
    this.footer.appendChild(this.btnAcceptAll);
    /* Add event listeners */
    this.addParamsEvent();
    this.addAcceptAllEvent();
    this.addSaveEvent();
    this.addRejectEvent();

    // Listen when add the messages|translations into HTML
    this.#dispatcher.addListener(
      ConsentEvent.UiMessages,
      (locale: LanguageCode, cardMessages: ConsentMessages, categories: Map<string, Category>) => {
        console.log("Update messages in UI!", locale, cardMessages, categories);
        this.updateMessages(locale, cardMessages, categories);
      },
    );
  }

  /**
   * Add all elements to complete the card HTML
   * @param {Map<string, Category>} categories
   * @returns {Promise<HTMLDivElement>}
   */
  async render(categories: Map<string, Category>): Promise<HTMLDivElement | never> {
    // Render all categories with their cookies
    categories.forEach((category: Category) => {
      const { categoryContainer, categoryTrigger, categoryContent } = this.renderCategory(category);
      this.addCategoryBehavior(categoryContainer, categoryTrigger, categoryContent);
      this.body.appendChild(categoryContainer);
    });
    // Add all elements inside the card element
    this.card.appendChild(this.topBar);
    this.card.appendChild(this.header);
    this.card.appendChild(this.body);
    this.card.appendChild(this.footer);

    return this.card;
  }

  /**
   * Create cookie HTML
   * @param {Cookie} cookie
   * @returns {{input: HTMLInputElement, cookieContainer: HTMLDivElement, description: HTMLDivElement, label: HTMLLabelElement, switchContainer: HTMLDivElement}}
   * @private
   */
  private renderCookie(cookie: Cookie): {
    input: HTMLInputElement;
    cookieContainer: HTMLDivElement;
    description: HTMLDivElement;
    label: HTMLLabelElement;
    switchContainer: HTMLDivElement;
  } {
    const cookieContainer = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_cookie",
    });
    const switchContainer = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_switch_container",
    });
    const input = createHTMLElement<HTMLInputElement>("input", {
      type: "checkbox",
      class: `cc_switch ${ANIMATION_DISABLED_CLASS}`,
      id: `cc_${strToId(cookie.categoryName)}_${strToId(cookie.name)}`,
      name: `${strToId(cookie.categoryName)}_${strToId(cookie.name)}`,
    });
    const label = createHTMLElement<HTMLLabelElement>("label", {
      for: `cc_${strToId(cookie.categoryName)}_${strToId(cookie.name)}`,
    });
    const description = createHTMLElement<HTMLDivElement>("div", {
      id: `cc_${strToId(cookie.categoryName)}_${strToId(cookie.name)}_description`,
      class: "cc_cookie_description",
    });
    // Add cookie name and description
    label.innerText = cookie.name;
    description.innerText = cookie.description;

    // If cookie is mandatory, add checked and disabled attributes
    if (!cookie.isRevocable) {
      input.checked = true;
      input.setAttribute("disabled", "");
    }

    switchContainer.appendChild(input);
    switchContainer.appendChild(label);
    cookieContainer.appendChild(switchContainer);
    cookieContainer.appendChild(description);

    // Listen when input change (only to revacable cookie)
    if (cookie.isRevocable) {
      input.addEventListener("change", (e: Event) => {
        e.preventDefault();
        this.#dispatcher.dispatch(ConsentEvent.Change, input, cookie);
      });
    }

    return {
      cookieContainer,
      switchContainer,
      input,
      label,
      description,
    };
  }

  /**
   * Add event listeners to show/hide the category cookies
   * @param {HTMLDivElement} categoryContainer
   * @param {HTMLButtonElement} categoryTrigger
   * @param {HTMLDivElement} categoryContent
   * @private
   */
  private addCategoryBehavior(categoryContainer: HTMLDivElement, categoryTrigger: HTMLButtonElement, categoryContent: HTMLDivElement) {
    const inputs: NodeListOf<HTMLInputElement> = categoryContent.querySelectorAll('input[type="checkbox"].cc_switch');
    /**
     * Remove ANIMATION_DISABLED_CLASS after categoryContent fadeIn to avoid the switch animation
     * @param {AnimationEvent} e
     */
    const animationEndFn = (e: AnimationEvent) => {
      if (e.animationName === FADE_IN_ANIMATION_TOKEN) {
        // Allow animation on cc_switch by removing ANIMATION_DISABLED_CLASS on them
        for (const input of inputs) {
          input.classList.remove(ANIMATION_DISABLED_CLASS);
        }
        categoryContent.removeEventListener("animationend", animationEndFn);
      }
    };

    // Category click event
    categoryTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (categoryContent.hasAttribute("hidden")) {
        categoryContainer.classList.add(IS_OPEN_CLASS);
        categoryContent.addEventListener("animationend", animationEndFn.bind(this));
        // Show content
        UI.showElement(categoryContent);
      } else {
        // Hide content
        for (const input of inputs) {
          input.classList.add(ANIMATION_DISABLED_CLASS);
        }
        UI.hideElement(categoryContent);
      }
    });
  }

  /**
   * Create Category HTML
   * @param {Category} category
   * @returns {{categoryContainer: HTMLDivElement, categoryTrigger: HTMLButtonElement, categoryContent: HTMLDivElement}}
   * @private
   */
  private renderCategory(category: Category): {
    categoryContainer: HTMLDivElement;
    categoryTrigger: HTMLButtonElement;
    categoryContent: HTMLDivElement;
  } {
    const categoryContainer = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_category",
    });
    const categoryContent = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_category_content",
      hidden: "",
      "aria-hidden": "true",
    });
    const categoryTrigger = createHTMLElement<HTMLButtonElement>("button", {
      type: "button",
      id: `cc_${strToId(category.name)}`,
      class: "cc_category_trigger",
      "data-cc-category-trigger": "button",
    });

    // Add the button to display the content of the category.
    categoryTrigger.innerText = category.name;
    categoryContainer.appendChild(categoryTrigger);

    // Add the description if there is one.
    if (category.description) {
      const categoryDescription = createHTMLElement<HTMLDivElement>("div", {
        class: "cc_category_description",
        id: `cc_${strToId(category.name)}_description`,
      });
      categoryDescription.innerText = category.description;
      categoryContent.appendChild(categoryDescription);
    }

    // Create the list that will display the cookies.
    const cookiesList = createHTMLElement<HTMLUListElement>("ul", {});

    category.cookies.forEach((cookie: Cookie) => {
      const cookiesListItem = createHTMLElement<HTMLLIElement>("li", {});
      const { cookieContainer } = this.renderCookie(cookie);
      // Append to the list
      cookiesListItem.appendChild(cookieContainer);
      cookiesList.appendChild(cookiesListItem);
    });

    // Append the list to category
    categoryContent.appendChild(cookiesList);
    categoryContainer.appendChild(categoryContent);

    return {
      categoryContainer,
      categoryContent,
      categoryTrigger,
    };
  }

  /**
   * Update the input corresponding to the cookie
   * If the cookie is accepted, set checked attribut on the input
   * @param {Map<string, Category>} categories
   * @returns {this}
   */
  update(categories: Map<string, Category>) {
    categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        if (cookie.isRevocable) {
          const checkbox: HTMLInputElement | null = this.card.querySelector(`input#cc_${strToId(category.name)}_${strToId(cookie.name)}`);
          if (checkbox) {
            checkbox.checked = cookie.isAccepted;
          }
        }
      });
    });

    return this;
  }

  /**
   * Add messages
   * @param {LanguageCode | string} locale
   * @param {ConsentMessages} messages
   * @param {Map} categories
   */
  updateMessages(locale: LanguageCode | string, messages: ConsentMessages | undefined, categories: Map<string, Category>) {
    if (messages !== undefined) {
      this.#messages = messages;
      this.title.innerHTML = messages.title;
      this.description.innerHTML = messages.description;
      this.btnContinueWithoutAccepting.innerHTML = messages.continue_without_accepting;
      this.btnSave.innerHTML = messages.save;
      this.btnAcceptAll.innerHTML = messages.accept_all;
      this.btnReject.innerHTML = messages.reject;
      this.btnParams.innerHTML = messages.open_preferences;
    } else {
      console.error("Messages not provided for locale " + locale);
    }

    categories.forEach((category) => {
      const categoryName: HTMLElement | null = this.card.querySelector(`#cc_${strToId(category.name)}`);
      if (categoryName) {
        if (category.translations.hasOwnProperty(locale)) {
          categoryName.innerHTML = category.translations[locale]!.name;
        } else {
          categoryName.innerHTML = category.name;
        }
      }
      const categoryDescription: HTMLElement | null = this.card.querySelector(`#cc_${strToId(category.name)}_description`);
      if (categoryDescription) {
        if (category.translations.hasOwnProperty(locale)) {
          categoryDescription.innerHTML = category.translations[locale]!.description;
        } else {
          categoryDescription.innerHTML = category.description;
        }
      }

      category.cookies.forEach((cookie) => {
        const cookieName: HTMLElement | null = this.card.querySelector(`label[for="cc_${strToId(category.name)}_${strToId(cookie.name)}"]`);
        if (cookieName) {
          if (cookie.translations.hasOwnProperty(locale)) {
            cookieName.innerHTML = cookie.translations[locale]!.name;
          } else {
            cookieName.innerHTML = cookie.name;
          }
        }
        const cookieDescription: HTMLElement | null = this.card.querySelector(`#cc_${strToId(category.name)}_${strToId(cookie.name)}_description`);
        if (cookieDescription) {
          if (cookie.translations.hasOwnProperty(locale)) {
            cookieDescription.innerHTML = cookie.translations[locale]!.description;
          } else {
            cookieDescription.innerHTML = cookie.description;
          }
        }
      });
    });
  }

  private addParamsEvent() {
    this.btnParams.addEventListener("click", () => {
      if (this.body.hasAttribute("hidden")) {
        // Switch to Close params text
        this.btnParams.innerHTML = this.#messages!.close_preferences || "";
        // Hide SaveAll button
        UI.hideElement(this.btnAcceptAll);
        // Show Save button
        UI.showElement(this.btnSave);
        // Show the cc_body
        UI.showElement(this.body);
        // Open first category
        const firstCategoryContent: HTMLDivElement | null = this.card.querySelector(".cc_category .cc_category_content");
        if (firstCategoryContent !== null) {
          UI.showElement(firstCategoryContent);
          // Add focus on first category's cookie
          const firstCookieInput: HTMLInputElement | null = firstCategoryContent.querySelector('.cc_cookie input[type="checkbox"]');
          if (firstCookieInput !== null) {
            firstCookieInput.focus();
          }
        }
        this.#dispatcher.dispatch(ConsentEvent.OpenParams);
      } else {
        this.btnParams.innerHTML = this.#messages!.open_preferences || "";
        // Switch to Open params text
        UI.showElement(this.btnAcceptAll);
        // Show SaveAll button
        UI.showElement(this.btnAcceptAll);
        // Hide Save button
        UI.hideElement(this.btnSave);
        // hide the cc_body
        UI.hideElement(this.body);
        this.#dispatcher.dispatch(ConsentEvent.CloseParams);
      }
    });
  }

  private addAcceptAllEvent() {
    this.btnAcceptAll.addEventListener("click", () => {
      this.#dispatcher.dispatch(ConsentEvent.AcceptAll);
    });
  }

  private addSaveEvent() {
    this.btnSave.addEventListener("click", () => {
      this.#dispatcher.dispatch(ConsentEvent.Save);
    });
  }

  private addRejectEvent() {
    [this.btnReject, this.btnContinueWithoutAccepting].forEach((btn) => {
      btn.addEventListener("click", () => {
        this.#dispatcher.dispatch(ConsentEvent.Reject);
      });
    });
  }

  /**
   * @param {HTMLElement | Element} element
   * @private
   */
  private static hideElement(element: HTMLElement | Element) {
    element.setAttribute("hidden", "hidden");
    element.classList.remove(IS_OPEN_CLASS);
    element.setAttribute("aria-hidden", "true");
  }

  /**
   * @param {HTMLElement | Element} element
   * @private
   */
  private static showElement(element: HTMLElement | Element) {
    element.removeAttribute("hidden");
    element.classList.add(IS_OPEN_CLASS);
    element.setAttribute("aria-hidden", "false");
  }
}
