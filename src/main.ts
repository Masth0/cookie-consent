import "./style.css";
import { CookieConsent } from "../lib/CookieConsent.ts";
import { Category } from "../lib/Category.ts";
import { consentMessages } from "../lib/Translations.ts";
import { Cookie } from "../lib/Cookie.ts";


// To set messages
const categoryMandatory = new Category({
    name: "Mandatory",
    description: "...",
    cookies: new Map(),
    translations: {
        "fr": {
            name: "Obligatoires",
            description: "..."
        }
    }
});

const cookieTest = new Cookie({
    name: "test",
    description: "description de test",
    domain: "",
    iframes: [],
    revocable: false,
    scripts: [],
    tokens: [],
    translations: {}
});
cookieTest.addTranslations({
    "fr": {
        name: "aa",
        description: "azez"
    }
    });

const consent = new CookieConsent({
    locale: "fr",
    version: "1.0.0",
    categories: [categoryMandatory],
    translations: {
        ...consentMessages
    }
});

const btnConsent = document.querySelector("[data-cc-open]");
if (btnConsent) {
    btnConsent.addEventListener("click", function (e) {
        e.preventDefault();
        consent.show();
    });
}

const btnLocales: NodeListOf<HTMLButtonElement> = document.querySelectorAll('.js-btn-locale');

function btnLocalesActiveClass(btnsList: NodeListOf<HTMLElement>, btnClicked: HTMLElement, activeClass: string = 'active') {
    for (const btn of btnsList) {
        if (btn === btnClicked) {
            btn.classList.add(activeClass);
        } else {
            btn.classList.remove(activeClass);
        }
    }
}

for (const btnLocale of btnLocales) {
    btnLocale.addEventListener("click", function(e) {
        e.preventDefault();
        const locale = btnLocale.dataset.language?.trim();
        if (locale) {
            consent.locale = locale;
            btnLocalesActiveClass(btnLocales, this);
        }
    });
}