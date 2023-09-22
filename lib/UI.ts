import { Category } from "./Category.ts";
import { Cookie } from "./Cookie.ts";
import { ConsentMessages } from "./Translations.ts";
import { createCustomEvent, strToId } from "./utils.ts";
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

enum DatasetActionUI {
  Save = "data-cc-save",
  SaveAll = "data-cc-save-all",
  Reject = "data-cc-reject",
  Params = "data-cc-params",
}

export interface CookieChangeEventDict {
  cookie: Cookie;
  input: HTMLInputElement;
}

export class UI {
  get messages(): ConsentMessages {
    return this._messages;
  }

  set messages(value: ConsentMessages) {
    this._messages = value;
    this.updateMessages(this._messages);
  }

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

  constructor(private _messages: ConsentMessages, private dispatcher: EventDispatcher) {
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

    this.topBar.appendChild(this.btnContinueWithoutAccepting);

    this.header.appendChild(this.title);
    this.header.appendChild(this.versionInfo);
    this.header.appendChild(this.description);

    this.footer.appendChild(this.btnParams);
    this.footer.appendChild(this.btnReject);
    this.footer.appendChild(this.btnSave);
    this.footer.appendChild(this.btnAcceptAll);

    this.addParamsEvent();
    this.addAcceptAllEvent();
    this.addSaveEvent();
    this.addRejectEvent();
  }

  async render(categories: Map<string, Category>): Promise<HTMLDivElement | never> {
    if (!this._messages) {
      return Promise.reject("Consent messages are not set, render cancelled.");
    }

    categories.forEach((category: Category) => {
      const categoryHTMLElements = this.renderCategory(category);
      this.addCategoryBehavior(categoryHTMLElements.categoryContainer, categoryHTMLElements.categoryTrigger, categoryHTMLElements.categoryContent);
      this.body.appendChild(categoryHTMLElements.categoryContainer);
    });

    this.card.appendChild(this.topBar);
    this.card.appendChild(this.header);
    this.card.appendChild(this.body);
    this.card.appendChild(this.footer);

    return this.card;
  }

  update(categories: Map<string, Category>) {
    categories.forEach((category: Category) => {
      category.cookies.forEach((cookie: Cookie) => {
        if (cookie.isRevocable) {
          const checkbox: HTMLInputElement | null = this.card.querySelector(`input#cc_${strToId(cookie.categoryName)}_${strToId(cookie.name)}`);
          if (checkbox) {
            checkbox.checked = cookie.isAccepted;
          }
        }
      });
    });

    return this;
  }

  updateMessages(messages: ConsentMessages) {
    this.title.innerHTML = messages.title;
    this.description.innerHTML = messages.description;
    this.btnContinueWithoutAccepting.innerHTML = messages.continue_without_accepting;
    this.btnSave.innerHTML = messages.save;
    this.btnAcceptAll.innerHTML = messages.save_all;
    this.btnReject.innerHTML = messages.reject;
    this.btnParams.innerHTML = messages.open_preferences;
  }

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
    label.innerText = cookie.name;
    const description = createHTMLElement<HTMLDivElement>("div", {
      class: "cc_cookie_description",
    });
    description.innerText = cookie.description;

    if (!cookie.isRevocable) {
      input.checked = true;
      input.setAttribute("disabled", "");
    }

    switchContainer.appendChild(input);
    switchContainer.appendChild(label);
    cookieContainer.appendChild(switchContainer);
    cookieContainer.appendChild(description);

    // onChange
    input.addEventListener("change", (e: Event) => {
      e.preventDefault();
      this.dispatcher.dispatch<{"input": HTMLInputElement, "cookie": Cookie }>(ConsentEvent.Change, {input, cookie});
      /*const onInputChange: CustomEvent = new CustomEvent<CookieChangeEventDict>(ConsentEvent.Change, {
        detail: {
          input,
          cookie,
        },
      });
      this.card.dispatchEvent(onInputChange);*/
    });

    return {
      cookieContainer,
      switchContainer,
      input,
      label,
      description,
    };
  }

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
      class: "cc_category_trigger",
      "data-cc-category-trigger": "button",
    });
    categoryTrigger.innerText = category.name;

    categoryContainer.appendChild(categoryTrigger);

    if (category.description) {
      const categoryDescription = createHTMLElement<HTMLDivElement>("div", {
        class: "cc_category_description",
      });
      categoryDescription.innerText = category.description;
      categoryContent.appendChild(categoryDescription);
    }

    const cookiesList = createHTMLElement<HTMLUListElement>("ul", {});

    category.cookies.forEach((cookie: Cookie) => {
      const cookiesListItem = createHTMLElement<HTMLLIElement>("li", {});
      const cookieHTMLElements = this.renderCookie(cookie);

      cookiesListItem.appendChild(cookieHTMLElements.cookieContainer);
      cookiesList.appendChild(cookiesListItem);
    });

    categoryContent.appendChild(cookiesList);
    categoryContainer.appendChild(categoryContent);

    return {
      categoryContainer,
      categoryContent,
      categoryTrigger,
    };
  }

  private addCategoryBehavior(categoryContainer: HTMLDivElement, categoryTrigger: HTMLButtonElement, categoryContent: HTMLDivElement) {
    const inputs: NodeListOf<HTMLInputElement> = categoryContent.querySelectorAll('input[type="checkbox"].cc_switch');
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

  disableCssAnimationOnSwitches(elements: HTMLInputElement[]) {
    for (const input of elements) {
      input.classList.remove(ANIMATION_DISABLED_CLASS);
    }
  }

  private addParamsEvent() {
    this.btnParams.addEventListener("click", () => {
      if (this.body.hasAttribute("hidden")) {
        // Switch to Close params text
        if (this._messages !== undefined) {
          this.btnParams.innerHTML = this._messages.close_preferences;
        }
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
        this.card.dispatchEvent(createCustomEvent(ConsentEvent.OpenParams, { details: {} }));
      } else {
        this.btnParams.innerHTML = this._messages.open_preferences;
        // Switch to Open params text
        UI.showElement(this.btnAcceptAll);
        // Show SaveAll button
        UI.showElement(this.btnAcceptAll);
        // Hide Save button
        UI.hideElement(this.btnSave);
        // hide the cc_body
        UI.hideElement(this.body);
        this.card.dispatchEvent(createCustomEvent(ConsentEvent.CloseParams, { details: {} }));
      }
    });
  }

  private addAcceptAllEvent() {
    this.btnAcceptAll.addEventListener("click", () => {
      this.dispatcher.dispatch(ConsentEvent.AcceptAll);
    });
  }

  private addSaveEvent() {
    this.btnSave.addEventListener("click", () => {
      this.dispatcher.dispatch(ConsentEvent.Save);
    });
  }

  private addRejectEvent() {
    [this.btnReject, this.btnContinueWithoutAccepting].forEach((btn) => {
      btn.addEventListener("click", () => {
        this.dispatcher.dispatch(ConsentEvent.Reject);
      });
    });
  }

  private static hideElement(element: HTMLElement | Element) {
    element.setAttribute("hidden", "hidden");
    element.classList.remove(IS_OPEN_CLASS);
    element.setAttribute("aria-hidden", "true");
  }

  private static showElement(element: HTMLElement | Element) {
    element.removeAttribute("hidden");
    element.classList.add(IS_OPEN_CLASS);
    element.setAttribute("aria-hidden", "false");
  }
}
