import { createHTMLElement } from "./helpers.ts";

export interface IFramePlaceholderMessages {
  
  title: string;
  description: string;
  btnLabel: string;
}

export class IFramePlaceholderElement {
  get $el(): HTMLDivElement {
    return this.#placeholder;
  }
  
  #categoryName: string;
  #cookieName: string;
  #messages: IFramePlaceholderMessages;
  #placeholder: HTMLDivElement;
  #title: HTMLHeadingElement;
  #description: HTMLParagraphElement;
  #btn: HTMLButtonElement;
  
  constructor(categoryName: string, cookieName: string, messages?: IFramePlaceholderMessages) {
    this.#categoryName = categoryName;
    this.#cookieName = cookieName;
    if (messages) {
      this.#messages = messages;
    }
    this.#placeholder = createHTMLElement<HTMLDivElement>("DIV", {
      "class": "cc_placeholder"
    });
    this.#title = createHTMLElement<HTMLHeadingElement>('h3', {"class": "cc_placeholder_title"});
    this.#description = createHTMLElement<HTMLHeadingElement>('p', {"class": "cc_placeholder_description"});
    this.#btn = createHTMLElement<HTMLButtonElement>('button', {
      "class": "cc_button"
    });
  }
  
  updateMessages(messages: IFramePlaceholderMessages) {
    this.#title.innerText = messages.title;
    this.#description.innerText = messages.description;
    this.#btn.innerText = messages.btnLabel;
  }
  
}
