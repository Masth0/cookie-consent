import { createHTMLElement } from "./helpers.ts";
import {LanguageCode} from "../Translations.ts";
import {Cookie} from "../Cookie.ts";


export class IFramePlaceholderElement {
  get $el(): HTMLDivElement {
    return this.#placeholder;
  }

  #cookie: Cookie;
  #translations: { [key in LanguageCode | string]?: string };
  #placeholder: HTMLDivElement;
  #message: HTMLParagraphElement;

  constructor(cookie: Cookie, translations?: { [key in LanguageCode | string]?: string }) {
    this.#cookie = cookie;
    if (translations) {
      this.#translations = translations;
    }
    this.#placeholder = createHTMLElement<HTMLDivElement>("DIV", {
      "class": "cc_iframe_placeholder"
    });
    this.#message = createHTMLElement<HTMLParagraphElement>('p', {"class": "cc_placeholder_message"});
    this.#placeholder.appendChild(this.#message);
  }
  
  updateMessages(message: string) {
    this.#message.innerText = message;
  }
  
}