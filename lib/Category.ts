import {CookieDefinition, CookieDefinitionConfig} from "./CookieDefinition";

export class Category {
  get description(): string {
    return this.config.description;
  }
  get name(): string {
    return this.config.name;
  }
  get cookies(): CookieDefinition[] {
    return this.config.cookies;
  }

  constructor(private config: CategoryConfig) {}

  addCookie(cookieConfig: CookieDefinitionConfig): Category {
    const cookie: CookieDefinition = new CookieDefinition(cookieConfig);
    cookie.categoryName = cookieConfig.categoryName ?? this.config.name;
    this.config.cookies.push(cookie);
    return this;
  }

  getCookie(name: string): CookieDefinition|undefined {
    return this.cookies.find((cookie: CookieDefinition) => cookie.name === name);
  }
}

export interface CategoryConfig {
  name: string;
  description: string;
  cookies: CookieDefinition[];
}