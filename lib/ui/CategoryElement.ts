import {createHTMLElement, OPEN_CLASS, strToId} from "./helpers.ts";
import {CookieElement} from "./CookieElement.ts";
import { CcElement } from "./CcElement.ts";


/* Category HTML
<div class="cc_category">
    <button type="button" class="cc_category_trigger">[category.name]</button>
    <div class="cc_category_content">
        <p class="cc_category_description">[category.description]</p>
        <ul class="cc_category_cookies">
            <li><CookieElement></li>
            ...
        </ul>
    </div>
    <p>CookieDescription</p>
</div>
*/
interface CategoryMessages {
    name: string;
    description: string;
}

export class CategoryElement extends CcElement<CategoryMessages> {
    readonly #name: string;
    readonly #inner: HTMLDivElement;
    readonly #trigger: HTMLButtonElement;
    readonly #description: HTMLParagraphElement;
    readonly #list: HTMLUListElement;
    protected messages: CategoryMessages = {
        name: "",
        description: "",
    };

    constructor(name: string) {
        super({"class": "cc_category"});
        this.#name = name;
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

    setMessages(messages: CategoryMessages) {
        if (messages.name !== this.messages.name) {
            this.#trigger.innerHTML = messages.name;
            this.messages.name = messages.name;
        }
        
        if (messages.description !== this.messages.description) {
            this.#description.innerHTML = messages.description;
            this.messages.description = messages.description
        }
    }

    open() {
        this.#trigger.classList.add(OPEN_CLASS);
        this.#inner.classList.add(OPEN_CLASS);
        this.#inner.removeAttribute("hidden");
    }

    close() {
        this.#trigger.classList.remove(OPEN_CLASS);
        this.#inner.classList.remove(OPEN_CLASS);
        this.#inner.setAttribute("hidden", "hidden");
    }

    private addEventListeners() {
        /**
         * Remove ANIMATION_DISABLED_CLASS after categoryContent fadeIn to avoid the switch animation
         * @param {AnimationEvent} e
         */
        this.#trigger.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.#inner.classList.contains(OPEN_CLASS)) {
                this.close();
            } else {
                this.open();
            }
        });
    }

    private render() {
        this.element.appendChild(this.#trigger);
        this.element.appendChild(this.#inner);
        this.#inner.appendChild(this.#description);
        this.#inner.appendChild(this.#list);
        this.element.appendChild(this.#inner);
    }

}