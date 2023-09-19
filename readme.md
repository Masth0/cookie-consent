# Cookie consent


## Configuration
```js
import {CookieConsent} from "../lib/CookieConsent.ts";
import {Category} from "../lib/Category.ts";
import {ConsentMessages} from "../lib/Translations.ts";


const cookieConsent = new CookieConsent({
    version: 0,
    forceToReload: false,
    categories: [],
    onSave() {},
    onReject() {},
    updateMessages(messages) {}
});

```

## Add cookie by script tag
| Attribut                              | Description                                                                     |
|---------------------------------------|---------------------------------------------------------------------------------|
| type                                  | Set `cookie-consent` to be parsed                                               |
| data-cc-category-category-name        | Category name                                                                   |
| data-cc-category-category-description | Category description                                                            |
| data-cc-category-name                 | Cookie name                                                                     |
| data-cc-category-description          | Cookie description                                                              |
| data-cc-revocable                     | Add it if the cookie isn't mandatory, the user will be able to allow or deny it |
| data-cc-tokens                        | List of cookie tokens added post user's acceptance                              |


```html
<script type="cookie-consent"
        data-cc-category-name="Marketing"
        data-cc-category-description="**Google Analytics** is a tool by Google that helps website owners understand their visitors' behavior and improve their site based on data about user interactions. It uses cookies to collect anonymous information about page views, traffic sources, and more."
        data-cc-name="Google Tag Manager"
        data-cc-description="Allows adding tracking tags such as Google Analytics, Google Ads, etc. to easily track the performance of the tags and the conversion of ads on the website."
        data-cc-revocable
        data-cc-tokens="_ga, _gid, _gcl_au, _gat_*, _ga_*"
        src="https://www.googleoptimize.com/optimize.js?id=GTM-XXXXXXX"
>...</script>
```



## Todos
- [] A11Y, focus trap, aria-label...
- [] Clean css, variables...