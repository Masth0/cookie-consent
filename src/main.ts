import './style.css'
import {Category} from "../lib/Category";
import CookieConsent from "../lib/index";


const mandatory: Category = CookieConsent.createCategory('Obligatoire', '...');
mandatory.addCookie({
    accepted: true,
    revocable: false,
    name: 'Identifiant de session',
    description: 'Permet de connaitre l\'identifiant de session. La session est utilisée pour la navigation et la sécuité des formulaires (CSRF) PHPSESSID',
    scripts: [],
    tokens: ['PHPSESSID']
  });


CookieConsent.setup({
  localeFallback: 'fr',
  version: 1,
  categories: [
    mandatory
  ],
  forceReload: true,
  translations: CookieConsent.UITranslationsDefault,
  onSave: () => {},
  onReject: () => {},
}).then((consent) => {
  console.log(consent);
  const $btnOpenConsent = document.querySelector('[data-cc-show]');
  if ($btnOpenConsent) {
    $btnOpenConsent.addEventListener('click', function() {
      consent.show();
    })
  }
});

