import './style.css';
import {CookieConsent} from "../lib/CookieConsent.ts";
import {Category} from "../lib/Category.ts";
import "../lib/EventDispatcher.ts";
import { En, Fr, LanguageCode } from "../lib/Translations.ts";


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
  version: 1,
  forceToReload: false, // Force to reload after one of those events SaveAll, Save and Reject.
  categories: [mandatoryCategory, marketingCategory],
  messages(msg) {
    let messages = msg;
    switch (document.documentElement.getAttribute('lang')) {
      case LanguageCode.Fr:
        messages = {...messages, ...Fr};
        console.log(messages);
        for (const categoriesKey in messages.categories) {
          console.log(messages.categories[categoriesKey]);
        }
        break;
      case LanguageCode.En:
        messages = En;
        break;
    }
    return messages;
  }
});

consent.setMessages(() => {
  // console.log(messages);
})

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