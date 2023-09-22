
export enum ConsentEvent {
  Show = "cc:show",
  Hide = "cc:hide",
  Save = "cc:save",
  AcceptAll = "cc:acceptAll",
  Reject = "cc:reject",
  Change = "cc:change",
  OpenParams = "cc:params:open",
  CloseParams = "cc:params:close",
}

export default class EventDispatcher {
  get listeners(): { [key in string | ConsentEvent]: Function[] } {
    return this.#listeners;
  }

  #listeners: { [key in string | ConsentEvent]: Function[] } = {};

  addListener(eventName: ConsentEvent, callback: Function) {
    if (!this.#listeners[eventName]) {
      this.#listeners[eventName] = [];
    }
    this.#listeners[eventName].push(callback);
  }

  removeListener(eventName: ConsentEvent, callback: Function) {
    if (this.#listeners[eventName]) {
      const index = this.#listeners[eventName].indexOf(callback);
      if (index !== -1) {
        this.#listeners[eventName].splice(index, 1);
      }
    }
  }

  dispatch<T>(eventName: ConsentEvent, eventData?: T) {
    if (this.#listeners[eventName]) {
      for (const callback of this.#listeners[eventName]) {
        callback.apply(null, [eventData]);
      }
    }
  }

}
