import { createHTMLElement } from "./helpers.ts";
import { Cookie } from "../Cookie.ts";
import EventDispatcher, { ConsentEvent } from "../EventDispatcher.ts";
import { CcElement } from "./CcElement.ts";


export interface IFramePlaceholderMessages {
  message: string;
  btnLabel: string;
}

export class IFramePlaceholderElement extends CcElement<IFramePlaceholderMessages> {
  get cookie(): Cookie {
    return this.#cookie;
  }
  
  readonly #cookie: Cookie;
  readonly #inner: HTMLDivElement;
  #message: HTMLParagraphElement;
  #btn: HTMLButtonElement;
  #dispatcher: EventDispatcher = EventDispatcher.getInstance();
  protected messages: IFramePlaceholderMessages = {
    message: "",
    btnLabel: ""
  };

  constructor(cookie: Cookie) {
    super({"class": "cc_iframe_placeholder"});
    this.#cookie = cookie;
    this.#inner = createHTMLElement<HTMLDivElement>("DIV", { "class": "cc_placeholder_inner" });
    this.#message = createHTMLElement<HTMLParagraphElement>('P', {"class": "cc_placeholder_message"});
    this.#btn = createHTMLElement<HTMLButtonElement>('BUTTON', {"class": "cc_btn", "data-cc-show": ""});
    this.#btn.innerText = "Open cookie consent";
    this.#inner.appendChild(this.#message);
    this.#inner.appendChild(this.#btn);
    this.element.appendChild(this.#inner);
    this.#btn.addEventListener("click", () => {
      this.#dispatcher.dispatch(ConsentEvent.Show);
    });
  }
  
  setMessages(messages: { message: string, btnLabel: string }) {
    this.#message.innerHTML = messages.message;
    this.#btn.innerHTML = messages.btnLabel;
  }
  
}