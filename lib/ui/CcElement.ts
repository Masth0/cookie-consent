import { createHTMLElement } from "./helpers.ts";

export abstract class CcElement<T> {
  get $el(): HTMLDivElement {
    return this.element;
  }
  
  protected readonly element: HTMLDivElement;
  protected abstract messages: T;
  
  protected constructor(attr?: { [key: string]: string } ) {
    this.element = createHTMLElement<HTMLDivElement>("DIV", attr);
  }
  
  abstract setMessages(msg: T): void;
}