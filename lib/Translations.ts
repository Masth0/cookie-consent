import { Cookie } from "./Cookie.ts";

export interface CategoryTranslation {
  name: string;
  description: string;
  cookies?: { [key: string]: Pick<Cookie, "name" | "description"> };
}

export interface ConsentMessages {
  title: string;
  description: string;
  open_preferences: string;
  close_preferences: string;
  reject: string;
  save_all: string;
  save: string;
  continue_without_accepting: string;
  categories: { [key: string]: CategoryTranslation };
}
