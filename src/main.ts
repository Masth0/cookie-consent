import './style.css';
import {CookieConsent} from "../lib/CookieConsent.ts";
import {Category} from "../lib/Category.ts";
import {ConsentMessages} from "../lib/Translations.ts";
import "../lib/EventDispatcher.ts";
import { ConsentEvent } from "../lib/EventDispatcher.ts";


const mandatoryCategory: Category = new Category('Mandatory', 'These cookies are mandatory to use this website...');
mandatoryCategory.addCookie({
  name: "PHPSESSID",
  description: "The server uses this cookie to identify the user's session and retrieve the appropriate data for that session. The PHPSESSID cookie is typically set to expire when the user closes their web browser.",
  domain: "",
  revocable: false,
  scripts: [],
  tokens: ["PHPSESSID"]
});

const marketingCategory: Category = new Category('Marketing', 'Analysing traffic.')
    marketingCategory.addCookie({
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
  messages(msg: ConsentMessages) {
    try {
      msg.title = 'We use cookies';
      msg.description = 'We use cookies to enhance your browsing experience, deliver ads or personalized content, and analyze our traffic. By clicking the "Accept All" button, you give your consent to our use of cookies.';
      msg.continue_without_accepting = 'Continue without accept';
      msg.save = 'Save';
      msg.save_all = 'Accept all';
      msg.reject = 'Reject all';
      msg.open_preferences = 'Customize';
      msg.close_preferences = 'Close preferences';
    } catch (e: any) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
    return msg;
  }
});

consent.setMessages((messages) => {
  console.log(messages);
})

consent.on(ConsentEvent.Show, (args: any) => {
  console.log("test", args);
})

consent.on(ConsentEvent.Change, () => {
})
consent.on(ConsentEvent.Save, () => {
})
consent.on(ConsentEvent.AcceptAll, () => {
})
consent.on(ConsentEvent.Reject, () => {
})
consent.on(ConsentEvent.OpenParams, () => {
})
consent.on(ConsentEvent.CloseParams, () => {
})


document.querySelector("[data-cc-open]")?.addEventListener('click', () => {
  consent.show();
})
