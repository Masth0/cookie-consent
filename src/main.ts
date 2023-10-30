import "./style.css";
import {CookieConsent} from "../lib/CookieConsent.ts";
import {Category} from "../lib/Category.ts";
import {messages} from "../lib/Translations.ts";




// To set messages
const categoryMandatory = new Category({name: "Mandatory", description: "...", cookies: new Map(), translations: {"fr": {name: "Obligatoires", description: "..."}}})

const consent = new CookieConsent({
    locale: "fr",
    version: "1.0.0",
    categories: [categoryMandatory],
    translations: {
        ...messages
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
for (const btnLocale of btnLocales) {
    btnLocale.addEventListener("click", function(e) {
        e.preventDefault();
        const locale = btnLocale.dataset.language?.trim();
        if (locale) consent.locale = locale;
    });
}