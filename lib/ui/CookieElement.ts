import {ANIMATION_DISABLED_CLASS, createHTMLElement, strToId} from "./helpers.ts";
import EventDispatcher, {ConsentEvent} from "../EventDispatcher.ts";
import { CcElement } from "./CcElement.ts";

/* Cookie HTML
<div class="cc_cookie">
    <div class="cc_switch_container">
       <input id="cookieName" type="checkbox">
       <label for="cookieName">CookieName</label>
    </div>
    <p>CookieDescription</p>
</div>
 */

export interface CookieMessages {
    name: string;
    description: string;
}

export class CookieElement extends CcElement<CookieMessages> {
    readonly #name: string;
    readonly #description: HTMLParagraphElement;
    readonly #switchContainer: HTMLDivElement;
    readonly #input: HTMLInputElement;
    readonly #label: HTMLLabelElement;
    readonly #dispatcher: EventDispatcher = EventDispatcher.getInstance();
    protected messages: CookieMessages = {
        name: "",
        description: ""
    };

    constructor(name: string) {
        super({ "class": "cc_cookie" });
        this.#name = name;
        this.#switchContainer = createHTMLElement<HTMLDivElement>("div", {
            "class": "cc_switch_container"
        });
        this.#input = createHTMLElement<HTMLInputElement>("input", {
            "id": `cc_cookie_${strToId(this.#name)}`,
            "class": "cc_switch " + ANIMATION_DISABLED_CLASS,
            "type": "checkbox",
        });
        this.#label = createHTMLElement<HTMLLabelElement>("label", {
            "for": `cc_cookie_${strToId(this.#name)}`
        });
        this.#description = createHTMLElement<HTMLParagraphElement>("p", {
            "aria-labelledby": `cc_cookie_${strToId(this.#name)}`,
            "class": "cc_cookie_description"
        });
        // Render
        this.render();
        // EventListeners
        this.addEventListeners();
    }
    
    setMessages(messages: {name: string, description: string}) {
        if (messages.name !== this.messages.name) {
            this.#label.innerHTML = messages.name;
            this.messages.name = messages.name;
        }
        
        if (messages.description !== this.messages.description) {
            this.#description.innerHTML = messages.description;
            this.messages.description = messages.description
        }
    }
    
    setChecked(value: boolean) {
        this.#input.checked = value;
    }

    private addEventListeners() {
        this.#input.addEventListener("change", (e) => {
            e.preventDefault();
            this.#dispatcher.dispatch<[string, boolean]>(ConsentEvent.CookieChange, this.#name, this.#input.checked);
        });
    }

    private render() {
        this.#switchContainer.appendChild(this.#input);
        this.#switchContainer.appendChild(this.#label);
        this.element.appendChild(this.#switchContainer);
        this.element.appendChild(this.#description);
    }
}