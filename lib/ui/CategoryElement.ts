import {createHTMLElement, OPEN_CLASS, strToId} from "./helpers.ts";
import {CookieElement} from "./CookieElement.ts";


/* Category HTML
<div class="cc_category">
    <button type="button" class="cc_category_trigger"></button>
    <div class="cc_category_content">
        <p class="cc_category_description"></p>
        <ul class="cc_category_cookies">
            <li><CookieElement></li>
            ...
        </ul>
    </div>
    <p>CookieDescription</p>
</div>
*/

export class CategoryElement {
    get $el(): HTMLDivElement {
        return this.#container;
    }

    readonly #name: string;
    readonly #container: HTMLDivElement;
    readonly #inner: HTMLDivElement;
    readonly #trigger: HTMLButtonElement;
    readonly #description: HTMLParagraphElement;
    readonly #list: HTMLUListElement;

    constructor(name: string) {
        this.#name = name;
        this.#container = createHTMLElement<HTMLDivElement>("div", {"class": "cc_category"});
        this.#trigger = createHTMLElement<HTMLButtonElement>("button", {"class": "cc_category_trigger", "id": `cc_category_${strToId(this.#name)}`});
        this.#inner = createHTMLElement<HTMLDivElement>("div", {"class": "cc_category_content", "hidden": "hidden", "aria-labelledby": `cc_category_${strToId(this.#name)}`});
        this.#description = createHTMLElement<HTMLParagraphElement>("p", {"class": "cc_category_description"});
        this.#list = createHTMLElement<HTMLUListElement>("ul", {"class": "cc_category_cookies"});
        // Render
        this.render();
        // EventListeners
        this.addEventListeners();
    }

    /**
     * Add cookie element
     * @param {CookieElement} element
     */
    addCookieElement(element: CookieElement): CategoryElement {
        const listItem = createHTMLElement<HTMLLIElement>("li", {});
        listItem.appendChild(element.$el);
        this.#list.appendChild(listItem);
        return this;
    }

    updateMessages(messages: {name: string, description: string}) {
        this.#trigger.innerHTML = messages.name;
        this.#description.innerHTML = messages.description;
    }

    private addEventListeners() {
        /**
         * Remove ANIMATION_DISABLED_CLASS after categoryContent fadeIn to avoid the switch animation
         * @param {AnimationEvent} e
         */
        this.#trigger.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.#inner.classList.contains(OPEN_CLASS)) {
                this.#trigger.classList.remove(OPEN_CLASS);
                this.#inner.classList.remove(OPEN_CLASS);
                this.#inner.setAttribute("hidden", "hidden");
            } else {
                this.#trigger.classList.add(OPEN_CLASS);
                this.#inner.classList.add(OPEN_CLASS);
                this.#inner.removeAttribute("hidden");
            }
        });
    }

    private render() {
        this.#container.appendChild(this.#trigger);
        this.#container.appendChild(this.#inner);
        this.#inner.appendChild(this.#description);
        this.#inner.appendChild(this.#list);
        this.#container.appendChild(this.#inner);
    }

}