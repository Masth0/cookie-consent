import { createHTMLElement } from "./helpers.ts";
import { LanguageCode } from "../Translations.ts";
import { Cookie } from "../Cookie.ts";
import EventDispatcher, { ConsentEvent } from "../EventDispatcher.ts";


export interface IFramePlaceholderMessages {
  message: string;
  btnLabel: string;
}

export class IFramePlaceholderElement {
  get $el(): HTMLDivElement {
    return this.#placeholder;
  }
 
  get translations(): { [key in LanguageCode | string]?: IFramePlaceholderMessages } {
    return this.#translations;
  }
  
  get cookie(): Cookie {
    return this.#cookie;
  }
  
  readonly #cookie: Cookie;
  #translations: {[key in LanguageCode | string]?: IFramePlaceholderMessages};
  #placeholder: HTMLDivElement;
  readonly #inner: HTMLDivElement;
  #message: HTMLParagraphElement;
  #btn: HTMLButtonElement;
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();

  constructor(cookie: Cookie) {
    this.#cookie = cookie;
    this.#placeholder = createHTMLElement<HTMLDivElement>("DIV", {
      "class": "cc_iframe_placeholder",
    });
    this.#inner = createHTMLElement<HTMLDivElement>("DIV", { "class": "cc_placeholder_inner" });
    this.#message = createHTMLElement<HTMLParagraphElement>('P', {"class": "cc_placeholder_message"});
    this.#btn = createHTMLElement<HTMLButtonElement>('BUTTON', {"class": "cc_btn", "data-cc-show": ""});
    this.#btn.innerText = "Open cookie consent";
    this.#inner.appendChild(this.#message);
    this.#inner.appendChild(this.#btn);
    this.#placeholder.appendChild(this.#inner);
    this.#btn.addEventListener("click", () => {
      this.#dispatcher.dispatch(ConsentEvent.Show);
    });
  }
  
  updateMessages(messages: { message: string, btnLabel: string }) {
    this.#message.innerHTML = messages.message;
    this.#btn.innerHTML = messages.btnLabel;
  }
  
}