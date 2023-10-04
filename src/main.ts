import "./style.css";
import "../lib/EventDispatcher.ts";
import { LanguageCode, messages } from "../lib/Translations.ts";
import { Category, CookieConsent } from "../lib/index.ts";


const mandatoryCategory: Category = new Category('Mandatory', 'These cookies are mandatory to use this website...');
mandatoryCategory.addCookie({
  name: "PHPSESSID",
  description: "The server uses this cookie to identify the user's session and retrieve the appropriate data for that session. The PHPSESSID cookie is typically set to expire when the user closes their web browser.",
  domain: "",
  revocable: false,
  scripts: [],
  tokens: ["PHPSESSID"],
  translations: {
    [LanguageCode.Fr]: {
      name: 'Sessions ID',
      description: 'lorem ipsum'
    }
  }
});

const marketingCategory: Category = new Category('Marketing', 'Analysing traffic.')
  .addCookie({
    description: 'description...',
    name: "Google Tag Manager",
    revocable: false,
    scripts: [],
    tokens: ['a', 'b', 'c']
});

const consent = new CookieConsent({
  locale: LanguageCode.Fr,
  version: 1,
  forceToReload: false, // Force to reload after one of those events SaveAll, Save and Reject.
  categories: [mandatoryCategory, marketingCategory],
  translations: {
    [LanguageCode.Fr]: messages.fr,
    [LanguageCode.En]: messages.en,
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
  })
}