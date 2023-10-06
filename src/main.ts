import "./style.css";
import "../lib/EventDispatcher.ts";
import { Category, CookieConsent, Translations } from "../lib/index.ts";


const mandatoryCategory: Category = new Category(
  'Mandatory',
  'These cookies are mandatory to use this website...',
  {
    [Translations.LanguageCode.Fr]: {
      name: 'Obligatoires',
      description: 'Description fr'
    }});
mandatoryCategory.addCookie({
  name: "PHPSESSID",
  description: "The server uses this cookie to identify the user's session and retrieve the appropriate data for that session. The PHPSESSID cookie is typically set to expire when the user closes their web browser.",
  domain: "",
  revocable: false,
  scripts: [],
  tokens: ["PHPSESSID"],
  translations: {
    [Translations.LanguageCode.Fr]: {
      name: 'ID de session',
      description: 'Description fr'
    },
  }
});

const marketingCategory: Category = new Category('Marketing', 'Analysing traffic.')
  .addCookie({
    description: 'GTAG description...',
    name: "Google Tag Manager",
    revocable: false,
    scripts: [],
    tokens: ['a', 'b', 'c']
});

const consent = new CookieConsent({
  locale: Translations.LanguageCode.En,
  version: 1,
  forceToReload: false, // Force to reload after one of those events SaveAll, Save and Reject.
  categories: [mandatoryCategory, marketingCategory],
  translations: {
    [Translations.LanguageCode.Fr]: Translations.messages.fr,
    [Translations.LanguageCode.En]: Translations.messages.en,
  }
});

consent.onChange((consent, input, cookie, cookieConsent) => {
  console.log(consent);
  console.log(input);
  console.log(cookie);
  console.log(cookieConsent);
});

consent.onReject((consent, cookieConsent) => {
  console.log(consent);
  console.log(cookieConsent);
});

document.querySelector("[data-cc-open]")?.addEventListener('click', () => {
  consent.show();
})

const localeBtns = document.querySelectorAll(".js-btn-locale");

for (const localeBtn of localeBtns) {
  localeBtn.addEventListener("click", () => {
    document.documentElement.setAttribute("lang", localeBtn.innerHTML);
    consent.locale = document.documentElement.getAttribute("lang")?.toLowerCase() || "fr";
  })
}