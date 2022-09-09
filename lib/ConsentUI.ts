import {Category} from "./Category";
import {CookieDefinition} from "./CookieDefinition";
import * as focusTrap from "focus-trap";

export class ConsentUI {
  locale: string;
  container: HTMLElement;
  private trap: focusTrap.FocusTrap;

  constructor(private categories: Category[], private translations: UITranslations) {
    this.container = this.createHTMLElement('div', {
      'class': 'cc_container',
      'id': 'cc_container',
      'aria-hidden': 'true',
      'hidden': '',
      'tabindex': '-1'
    });
    this.locale = document.documentElement.getAttribute('lang') || 'fr';
    this.trap = focusTrap.createFocusTrap(this.container, {
      allowOutsideClick: true,
      clickOutsideDeactivates: true,
      escapeDeactivates: true
    });
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.render();
      this.addParamsEvent();
      this.addSaveAllEvent();
      this.addSaveEvent();
      this.addRejectEvent();
      this.hide();
      resolve();
    });
  }

  show() {
    this.showElement(this.container);
    // this.container.setAttribute('tabindex', '1');
    setTimeout(() => {
      this.trap.activate();
    }, 100)
  }

  hide() {
    this.hideElement(this.container);
    // this.container.setAttribute('tabindex', '-1');
    this.trap.deactivate();
  }

  update(categories: Category[]) {
    this.categories = categories;
    for (let i = 0; i < this.categories.length; i++) {
      for (let j = 0; j < this.categories[i].cookies.length; j++) {
        const category: Category = this.categories[i];
        const cookie: CookieDefinition = this.categories[i].cookies[j];
        if (cookie.isRevocable) {
          const checkbox: HTMLInputElement|null = this.container.querySelector('input[name="' + cookie.name + '"][data-category="' + category.name + '"]');
          if (checkbox) {
            checkbox.checked = cookie.isAccepted;
          }
        }
      }
    }
    return this;
  }

  render() {
    const topbar_container = this.createHTMLElement('div', {
      'class': 'cc_topbar'
    });
    const topbar_btn = this.createHTMLElement('button', {
      'type': 'button',
      'class': 'cc_btn',
      'data-cc-reject': ''
    });
    topbar_btn.innerText = this.translations.btn.continue[this.locale];

    const header_container = this.createHTMLElement('div', {
      'class': 'cc_header'
    });
    const body_container = this.createHTMLElement('div', {
      'class': 'cc_body',
      'hidden': '',
      'aria-hidden': 'true'
    });
    const footer_container = this.createHTMLElement('div', {
      'class': 'cc_footer'
    });

    header_container.innerHTML = `
      <h2 class="cc_title">${this.translations.title[this.locale]}</h2>
      <p class="cc_description">${this.translations.description[this.locale]}</p>
    `;

    const btn_save = this.createHTMLElement('button', {
      'type': 'button',
      'class': 'cc_btn',
      [DatasetActionUI.Save]: '',
      'hidden': '',
      'aria-hidden': 'true'
    });
    btn_save.innerText = this.translations.btn.save[this.locale];
    const btn_params = this.createHTMLElement('button', {
      'type': 'button',
      'class': 'cc_btn',
      [DatasetActionUI.Params]: '',
    });
    btn_params.innerText = this.translations.btn.params[this.locale];
    const btn_reject = this.createHTMLElement('button', {
      'type': 'button',
      'class': 'cc_btn',
      [DatasetActionUI.Reject]: '',
    });
    btn_reject.innerText = this.translations.btn.reject[this.locale];
    const btn_accept_all = this.createHTMLElement('button', {
      'type': 'button',
      'class': 'cc_btn',
      [DatasetActionUI.SaveAll]: '',
    });
    btn_accept_all.innerText = this.translations.btn.saveAll[this.locale];

    topbar_container.appendChild(topbar_btn);
    this.container.appendChild(topbar_container);
    this.container.appendChild(header_container);
    this.container.appendChild(body_container);
    this.container.appendChild(footer_container);
    footer_container.appendChild(btn_params);
    footer_container.appendChild(btn_reject);
    footer_container.appendChild(btn_save);
    footer_container.appendChild(btn_accept_all);

    this.categories.forEach((category: Category) => {
      body_container.appendChild(this.categoryHtml(category));
    });

    document.body.appendChild(this.container);
  }

  private addParamsEvent() {
    const $paramsBtn: HTMLElement[] = [].slice.call(document.querySelectorAll('['+ DatasetActionUI.Params +']'));
    if ($paramsBtn.length > 0) {
      $paramsBtn.forEach(($btn: HTMLElement) => {
        $btn.addEventListener('click', (e) => {
          e.preventDefault();
          const $btnSaveSelection: HTMLButtonElement|null = this.container.querySelector('button['+ DatasetActionUI.Save +']');
          const $btnSaveAll: HTMLButtonElement|null = this.container.querySelector('button['+ DatasetActionUI.SaveAll +']');

          const $body = this.container.querySelector('.cc_body');
          if ($body && $body.hasAttribute('hidden')) {
            $btn.innerText = this.translations.btn.closeParams[this.locale];
            this.showElement($body);
            $body.querySelector('button')?.focus();
            if ($btnSaveSelection !== null) this.showElement($btnSaveSelection);
            if ($btnSaveAll !== null) this.hideElement($btnSaveAll);
            const firstCategoryBtn: HTMLButtonElement|null = $btn.querySelector('button');
            firstCategoryBtn?.focus();
          } else {
            $btn.innerText = this.translations.btn.params[this.locale];
            if ($body !== null) this.hideElement($body);
            if ($btnSaveSelection !== null) this.hideElement($btnSaveSelection);
            if ($btnSaveAll !== null) this.showElement($btnSaveAll);
          }
        })
      })
    }
  }

  private addSaveAllEvent() {
    const $saveBtn: HTMLElement[] = [].slice.call(document.querySelectorAll('['+ DatasetActionUI.SaveAll +']'));
    if ($saveBtn.length > 0) {
      $saveBtn.forEach(($btn: HTMLElement) => {
        $btn.addEventListener('click', (e) => {
          e.preventDefault();
          const saveAllEvent: CustomEvent = this.createEvent(UIEvent.AcceptAll, {});
          this.container.dispatchEvent(saveAllEvent);
        });
      });
    }
  }

  private addSaveEvent() {
    const $saveSelectionBtn: HTMLElement[] = [].slice.call(document.querySelectorAll('['+ DatasetActionUI.Save +']'));
    if ($saveSelectionBtn.length > 0) {
      $saveSelectionBtn.forEach(($btn: HTMLElement) => {
        $btn.addEventListener('click', (e) => {
          e.preventDefault();
          const saveEvent: CustomEvent = this.createEvent(UIEvent.Save, {});
          this.container.dispatchEvent(saveEvent);
        });
      });
    }
  }

  private addRejectEvent() {
    const $rejectBtn: HTMLElement[] = [].slice.call(document.querySelectorAll('['+ DatasetActionUI.Reject +']'));
    if ($rejectBtn.length > 0) {
      $rejectBtn.forEach(($btn: HTMLElement) => {
        $btn.addEventListener('click', () => {
          const rejectEvent: CustomEvent = this.createEvent(UIEvent.Reject, {});
          this.container.dispatchEvent(rejectEvent);
        });
      });
    }
  }

  private categoryHtml(category: Category): HTMLElement {
    const container: HTMLElement = this.createHTMLElement('div', {
      'class':'cc_category'
    });
    const inner = this.createHTMLElement('div', {
      'class':'cc_category_inner',
      'hidden': '',
      'aria-hidden': 'true'
    });
    const btn = this.createHTMLElement('button', {
      'type':'button',
      'class': 'cc_category_title',
      'data-cc-category-trigger': 'button',
    });
    btn.innerText = category.name;
    container.appendChild(btn);

    if (category.description) {
      const description = this.createHTMLElement('div', {
        'class': 'cc_description',
      });
      description.innerHTML = category.description;
      inner.appendChild(description);
    }

    const cookiesList: HTMLElement = this.createHTMLElement('ul', {});

    category.cookies.forEach((cookie: CookieDefinition) => {
      const li: HTMLElement = this.createHTMLElement('li', {});
      li.appendChild(this.cookieDefinitionHtml(cookie));
      cookiesList.appendChild(li);
    });

    inner.appendChild(cookiesList);

    container.appendChild(inner);
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const list = btn.nextElementSibling;
      if (list && list.hasAttribute('hidden')) {
        this.classList.add('is-open');
        list.removeAttribute('hidden');
        list.setAttribute('aria-hidden', 'false');
        list.querySelector('input')?.focus();
      } else {
        this.classList.remove('is-open');
        list?.setAttribute('hidden', '');
        list?.setAttribute('aria-hidden', 'true');
      }
    })

    return container;
  }

  private cookieDefinitionHtml(cookie: CookieDefinition): HTMLElement {
    const container: HTMLElement = document.createElement('div');
    container.classList.add('cc_cookie');

    const descriptionCol: HTMLElement = document.createElement('div');

    const description: HTMLElement = document.createElement('p');
    description.classList.add('cc_description');
    description.innerHTML = cookie.description;

    const choiceLabel: HTMLLabelElement = document.createElement('label');
    choiceLabel.innerHTML = cookie.name;
    choiceLabel.setAttribute('for', cookie.id);

    const checkbox: HTMLInputElement = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.category = cookie.categoryName;
    checkbox.name = cookie.name;
    checkbox.value = cookie.name;
    checkbox.id = cookie.id;
    checkbox.ariaLabel = cookie.name;
    checkbox.disabled = !cookie.isRevocable;
    checkbox.readOnly = !cookie.isRevocable;
    if (cookie.isAccepted || !cookie.isRevocable) checkbox.setAttribute('checked', 'checked');

    descriptionCol.appendChild(checkbox);
    descriptionCol.appendChild(choiceLabel);
    descriptionCol.appendChild(description);

    checkbox.addEventListener('change', (e) => {
      e.preventDefault();
      const onChoiceChange: CustomEvent = new CustomEvent(UIEvent.Change, {
        detail: {
          checkbox,
          cookie
        }
      });
      this.container.dispatchEvent(onChoiceChange);
    });

    container.appendChild(descriptionCol);

    return container;
  }

  private createHTMLElement(tag: string, attr: {[key: string]: string}) {
    const el = document.createElement(tag);

    for (const elKey in attr) {
      el.setAttribute(elKey, attr[elKey]);
    }

    return el;
  }

  private hideElement(element: HTMLElement|Element) {
    element.setAttribute('hidden', '');
    element.setAttribute('aria-hidden', 'true');
  }

  private showElement(element: HTMLElement|Element) {
    element.removeAttribute('hidden');
    element.setAttribute('aria-hidden', 'false');
  }

  private createEvent(name: UIEvent, detail: any): CustomEvent {
    return new CustomEvent(name, {
      detail: {
        ...detail
      }
    });
  }
}

export enum UIEvent {
  Save= 'on:save',
  AcceptAll = 'on:acceptAll',
  Reject = 'on:reject',
  Change = 'on:change',
}

enum DatasetActionUI {
  Save = 'data-cc-save',
  SaveAll = 'data-cc-save-all',
  Reject = 'data-cc-reject',
  Params = 'data-cc-params'
}

export interface UITranslations {
  title: {
    [key: string]: string,
  },
  description: {
    [key: string]: string,
  },
  btn: {
    params: {
      [key: string]: string,
    },
    closeParams: {
      [key: string]: string,
    },
    save: {
      [key: string]: string,
    },
    saveAll: {
      [key: string]: string,
    },
    reject: {
      [key: string]: string,
    },
    continue: {
      [key: string]: string,
    },
  }
}