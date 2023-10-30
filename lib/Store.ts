import { Cookie } from "./Cookie.ts";
import { Category } from "./Category.ts";
import { getCookieValue } from "./utils.ts";

export interface DeserializedConsent {
  version: string;
  cookies: Pick<Cookie, "name" | "categoryName" | "isAccepted" | "isRevocable">[];
}

export interface StoreData {
  version: string;
  categories: Map<string, Category>;
}

export class Store {
  get cookieKey(): string {
    return this.#cookieKey;
  }

  get categories(): Map<string, Category> {
    return this.#data.categories;
  }

  set data(value: StoreData) {
    this.#data = value;
  }

  #data: StoreData = { version: "", categories: new Map() };
  readonly #cookieKey: string;

  constructor(cookieKey: string) {
    this.#cookieKey = cookieKey || "_cc_consent";
  }

  serialize() {
    let consent: DeserializedConsent = {
      version: this.#data.version,
      cookies: [],
    };

    this.#data.categories.forEach(function (category: Category) {
      category.cookies.forEach((cookie, cookieName) => {
        consent.cookies.push({
          categoryName: category.name,
          name: cookieName,
          isAccepted: cookie.isAccepted,
          isRevocable: cookie.isRevocable,
        });
      });
    });

    return JSON.stringify(consent);
  }

  deserialize(): DeserializedConsent | undefined {
    const consentSaved: string | undefined = getCookieValue(this.#cookieKey);

    if (consentSaved) {
      return JSON.parse(consentSaved);
    }

    return undefined;
  }
}
