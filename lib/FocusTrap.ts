const findFocusableElements = function (container?: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  const parent: HTMLElement = container ? container : document.body;
  const selectors: string[] = [
    "a[href]",
    "button",
    "input",
    "textarea",
    "select",
    "details > summary:first-of-type",
    "video[controls]",
    "audio[controls]",
    '[tabindex="0"]',
  ];
  const selectorStr: string = selectors.join(",");
  let elements: NodeListOf<HTMLElement> = parent.querySelectorAll(selectorStr);

  for (const element of elements) {
    if (
      (element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height && !element.getAttribute("disabled")) ||
      parseInt(element.getAttribute("tabindex") || "-1") >= 0
    ) {
      result.push(element);
    }
  }

  return result;
};

export enum Key {
  Escape = 27,
  Tab = 9,
}

export default class FocusTrap {
  get firstTarget(): HTMLElement | null {
    return this.#firstTarget;
  }

  get lastTarget(): HTMLElement | null {
    return this.#lastTarget;
  }

  #targets: HTMLElement[];
  #firstTarget: HTMLElement | null;
  #lastTarget: HTMLElement | null;
  #observerOptions: Partial<MutationObserverInit> = {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["hidden", "style"],
    childList: true,
    characterData: false,
    subtree: true,
  };
  readonly #container: HTMLElement;
  readonly #keyHandler: OmitThisParameter<(e: KeyboardEvent) => void>;
  readonly #observer: MutationObserver;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#targets = findFocusableElements(this.#container);
    this.#lastTarget = this.#targets[this.#targets.length - 1];
    this.#firstTarget = this.#targets[0];
    this.#keyHandler = this.handle.bind(this);

    this.#observer = new MutationObserver(this.mutationCallback.bind(this));
    this.#observer.observe(this.#container, this.#observerOptions);
  }

  private mutationCallback(mutations: MutationRecord[]) {
    this.updateTargets();
    mutations.forEach((mutation) => {
      if (mutation.target === this.#container && mutation.type === "attributes" && mutation.attributeName === "hidden") {
        if (mutation.oldValue === "hidden") {
          this.firstTarget?.focus();
        }
      }
    });
  }

  handle(e: KeyboardEvent) {
    if (e.keyCode !== Key.Tab) return;

    if (e.shiftKey) {
      if (document.activeElement === this.#firstTarget) {
        e.preventDefault();
        this.#lastTarget?.focus();
      }
    } else {
      if (document.activeElement === this.#lastTarget) {
        e.preventDefault();
        this.#firstTarget?.focus();
      }
    }
  }

  listen() {
    this.#container.addEventListener("keydown", this.#keyHandler);
  }

  dispose() {
    this.#container.removeEventListener("keydown", this.#keyHandler);
  }

  disconnect() {
    let mutations = this.#observer.takeRecords();
    this.#observer?.disconnect();
    if (mutations.length > 0) {
      this.mutationCallback(mutations);
    }
  }

  updateTargets() {
    this.#targets = findFocusableElements(this.#container);
    this.#lastTarget = this.#targets[this.#targets.length - 1];
    this.#firstTarget = this.#targets[0];
  }
}
