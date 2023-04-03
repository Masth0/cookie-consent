

# Cookie consent

## Installation
```bash
npm i -S @Masth0/cookie-consent
```
**Files available**
```text
└── dist
    ├── cookie-consent.es.js
    ├── cookie-consent.umd.js
    └── es5
        └── cookie-consent.umd.es5.js
```

## Configuration
### By script tag

```html
<!-- Google Tag Manager -->
<script type="cookie-consent"
        data-category="Marketing"
        data-name="Google Tag Manager"
        src="https://www.googleoptimize.com/optimize.js?id=GTM-XXXXXXX"></script>
<script type="cookie-consent"
        data-type="text/javascript"
        data-category="Marketing"
        data-name="Google Tag Manager"
        data-description="Allows adding tracking tags such as Google Analytics, Google Ads, etc. to easily track the performance of the tags and the conversion of ads on the website."
        data-revocable="true"
        data-tokens="_ga, _gid, _gcl_au, _gat_*, _ga_*"
        >(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');
        </script>
        <!-- End Google Tag Manager -->
```

### With javascript
```javascript
import CookieConsent from '@masth0/cookie-consent';


const mandatory = CookieConsent.createCategory('Mandatory', 'Mandatory cookies');
mandatory.addCookie({
  accepted: true,
  revocable: false,
  name: 'PHP session id',
  description: 'Allows to know the session identifier. The session is used for navigation and form security (CSRF) PHPSESSID',
  scripts: [], // Auto filled if one or more script tags are present in HTML with the same name and category
  tokens: ['PHPSESSID']
});

CookieConsent.setup({
  version: 1,
  categories: [
    mandatory
  ],
  forceReload: true,
  onSave: () => {},
  onReject: () => {},
}).then((consent) => {
  const $btnOpenConsent = document.querySelector('[data-cc-show]');
  if ($btnOpenConsent) {
    $btnOpenConsent.addEventListener('click', function() {
      consent.show();
    })
  }
});
```

## Consent
## Category
## CookieDefinition
## Translations