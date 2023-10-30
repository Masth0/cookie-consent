export const FADE_IN_CLASS: string = "cc_fade-in";
export const ANIMATION_DISABLED_CLASS: string = "cc_animation-disabled";
export const OPEN_CLASS: string = "cc_is-open";
export const HIDDEN_CLASS: string = "cc_d-none";

export function createHTMLElement<T extends HTMLElement>(tag: string, attr: { [key: string]: string }): T {
    const el = <T>document.createElement(tag);

    for (const elKey in attr) {
        // Add "cc_" prefix for id and class attributes
        el.setAttribute(elKey, attr[elKey]);
    }

    return el;
}

export function strToId(str: string): string {
    const _str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Replace spaces and special characters with underscores
    const id: string = _str.replace(/[^\w-]+/g, "_");

    // Remove leading numbers or underscores from the ID
    const cleanedId: string = id.replace(/^[0-9_-]+/, "");

    // Make sure the ID starts with a letter
    const finalId: string = cleanedId.replace(/^([^a-zA-Z])/, "id_$1");

    return finalId.toLowerCase();
}

/**
 * @param {HTMLElement | Element} element
 * @private
 */
export function hideElement(element: HTMLElement | Element) {
    element.setAttribute("hidden", "hidden");
    element.classList.remove(OPEN_CLASS);
    element.classList.add(HIDDEN_CLASS);
    
    if (element.getAttribute("aria-hidden")) {
        element.setAttribute("aria-hidden", "true");
    }
    
    if (element.getAttribute("tabindex")) {
        element.setAttribute("tabindex", "-1");
    }
}

/**
 * @param {HTMLElement | Element} element
 * @private
 */
export function showElement(element: HTMLElement | Element) {
    element.removeAttribute("hidden");
    element.classList.add(OPEN_CLASS);
    element.classList.remove(HIDDEN_CLASS);
    
    if (element.getAttribute("aria-hidden")) {
        element.setAttribute("aria-hidden", "false");
    }
    
    if (element.getAttribute("tabindex")) {
        element.setAttribute("tabindex", "1");
    }
}