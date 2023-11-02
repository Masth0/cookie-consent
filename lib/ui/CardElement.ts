import {createHTMLElement, HIDDEN_CLASS, hideElement, OPEN_CLASS, showElement} from "./helpers.ts";
import EventDispatcher, {ConsentEvent} from "../EventDispatcher.ts";
import {CategoryElement} from "./CategoryElement.ts";


export interface CardMessages {
  title: string;
  description: string;
  version: string;
  continueWithoutAccepting: string;
  openSettings: string;
  closeSettings: string;
  reject: string;
  save: string;
  acceptAll: string;
}

export class CardElement {
  get $el(): HTMLDivElement {
    return this.#card;
  }
  
  get $version(): HTMLDivElement {
    return this.#version;
  }
  
  get btnSave(): HTMLButtonElement {
    return this.#btnSave
  }
  
  get btnAcceptAll(): HTMLButtonElement {
    return this.#btnAcceptAll;
  }

  readonly #card: HTMLDivElement;
  readonly #topbar: HTMLDivElement;
  readonly #header: HTMLDivElement;
  readonly #body: HTMLDivElement;
  readonly #footer: HTMLDivElement;
  readonly #version: HTMLDivElement;
  readonly #title: HTMLHeadingElement;
  readonly #description: HTMLParagraphElement;
  readonly #btnContinueWithoutAccepting: HTMLButtonElement;
  readonly #btnSettings: HTMLButtonElement;
  readonly #btnSave: HTMLButtonElement;
  readonly #btnReject: HTMLButtonElement;
  readonly #btnAcceptAll: HTMLButtonElement;
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();

  constructor() {
    this.#card = createHTMLElement<HTMLDivElement>("div", {
      "class": `cc_card ${HIDDEN_CLASS}`,
      "aria-hidden": "true",
      "tabindex": '-1'
    });
    this.#topbar = createHTMLElement<HTMLDivElement>("div", {"class": "cc_topbar"});
    this.#header = createHTMLElement<HTMLDivElement>("div", {"class": "cc_header"});
    this.#body = createHTMLElement<HTMLDivElement>("div", {"class": `cc_body ${HIDDEN_CLASS}`});
    this.#footer = createHTMLElement<HTMLDivElement>("div", {"class": "cc_footer"});
    this.#version = createHTMLElement<HTMLDivElement>('p', {"class": `cc_version ${HIDDEN_CLASS}`});
    this.#title = createHTMLElement<HTMLHeadingElement>('h3', {"class": "cc_card_title"});
    this.#description = createHTMLElement<HTMLHeadingElement>('p', {"class": "cc_card_description"});
    this.#btnContinueWithoutAccepting = createHTMLElement<HTMLButtonElement>('button', {"class": "cc_btn_continue"});
    this.#btnSettings = createHTMLElement<HTMLButtonElement>('button', {"class": "cc_btn_settings"});
    this.#btnSave = createHTMLElement<HTMLButtonElement>('button', {"class": `cc_btn_save ${HIDDEN_CLASS}`});
    this.#btnReject = createHTMLElement<HTMLButtonElement>('button', {"class": "cc_btn_reject"});
    this.#btnAcceptAll = createHTMLElement<HTMLButtonElement>('button', {"class": "cc_btn_accept_all"});
    // Listen click events from buttons
    this.addEventListeners();
    // Render
    this.render();
  }

  updateMessages(messages: CardMessages) {
    this.#title.innerHTML = messages.title;
    this.#description.innerHTML = messages.description;
    this.#version.innerHTML = messages.version;
    this.#btnContinueWithoutAccepting.innerHTML = messages.continueWithoutAccepting;
    this.#btnReject.innerHTML = messages.reject;
    this.#btnAcceptAll.innerHTML = messages.acceptAll;
    this.#btnSave.innerHTML = messages.save;
    if (this.#btnSettings.classList.contains(OPEN_CLASS)) {
      this.#btnSettings.innerHTML = messages.closeSettings;
    } else {
      this.#btnSettings.innerHTML = messages.openSettings;
    }
  }

  addCategory(category: CategoryElement): CardElement {
    this.#body.appendChild(category.$el);
    return this;
  }

  private render() {
    this.#topbar.appendChild(this.#btnContinueWithoutAccepting);
    this.#header.appendChild(this.#title);
    this.#header.appendChild(this.#version);
    this.#header.appendChild(this.#description);
    this.#footer.appendChild(this.#btnSettings);
    this.#footer.appendChild(this.#btnReject);
    this.#footer.appendChild(this.#btnAcceptAll);
    this.#footer.appendChild(this.#btnSave);
    this.#card.appendChild(this.#topbar);
    this.#card.appendChild(this.#header);
    this.#card.appendChild(this.#body);
    this.#card.appendChild(this.#footer);
  }

  private addEventListeners() {
    // Reject
    this.#btnContinueWithoutAccepting.addEventListener("click", (e) => {
      e.preventDefault();
      this.#dispatcher.dispatch(ConsentEvent.Reject);
    });
    this.#btnReject.addEventListener("click", (e) => {
      e.preventDefault();
      this.#dispatcher.dispatch(ConsentEvent.Reject);
    });

    // Settings
    this.#btnSettings.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleSettings();
    });

    // Save
    this.#btnSave.addEventListener("click", (e) => {
      e.preventDefault();
      this.#dispatcher.dispatch(ConsentEvent.Save);
    });

    // AcceptAll
    this.#btnAcceptAll.addEventListener("click", (e) => {
      e.preventDefault();
      this.#dispatcher.dispatch(ConsentEvent.AcceptAll);
    });
  }

  // Open/Close the list of cookies to let user makes his choices
  private toggleSettings() {
    if (this.#body.classList.contains(HIDDEN_CLASS)) {
      showElement(this.#body);
      this.#dispatcher.dispatch(ConsentEvent.OpenSettings);
    } else {
      hideElement(this.#body);
      this.#dispatcher.dispatch(ConsentEvent.CloseSettings);
    }
  }
}