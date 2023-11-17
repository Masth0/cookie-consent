import { ScriptTagAttributes } from "./CookieConsent.ts";

export function getAllCookies(): Array<{ name: string; value: string }> {
  return document.cookie.split(";").map((str) => {
    const [name, value] = str.split("=").map((v) => v.trim());
    return { name, value };
  });
}

export function isAttributeValid(attrValue: undefined | null | string): boolean {
  return attrValue !== "" || (attrValue !== undefined && attrValue !== null);
}

export function arrayToMap<T extends { [key: string]: any }>(src: T[], property?: string): Map<string, T> {
  const result: Map<string, T> = new Map();

  for (const srcObj of src) {
    if (property && <{ [key: string]: unknown }>srcObj[property]) {
      result.set(srcObj[property], srcObj);
    }
  }

  return result;
}

export function getCookieValue(name: string): string | undefined {
  const value: string = "; " + document.cookie;
  let parts: string[] = value.split("; " + name + "=");
  return parts.length < 2 ? undefined : parts.pop()?.split(";").shift();
}

export function checkRequiredScriptTagAttributes(scriptTag: HTMLScriptElement) {
  const requiredAttributes: string[] = [ScriptTagAttributes["CategoryName"], ScriptTagAttributes["CookieName"]];
  const attrPresents: string[] = [];

  for (const attr of scriptTag.attributes) {
    if (requiredAttributes.indexOf(attr.name) !== -1 && isAttributeValid(attr.value)) {
      attrPresents.push(attr.name);
    }
  }

  return attrPresents.length === requiredAttributes.length;
}

/**
 * TODO move to Cookie
 * Add "src" attribute from "data-cc-src"
 * Attribute "data-cc-name" is mandatory, and it must have the Cookie.name as value
 * @param {string} cookieName
 */
export function enableCookieIframes(cookieName: string) {
  const $iframes: NodeListOf<HTMLIFrameElement> = document.querySelectorAll(`iframe[data-cc-name="${cookieName}"]`);
  
  for (const $iframe of $iframes) {
    if (!$iframe.hasAttribute('src') && $iframe.dataset.ccSrc) {
      $iframe.setAttribute('src', $iframe.dataset.ccSrc);
    }
  }
}

/**
 * TODO move to Cookie
 * Add "data-cc-src" attribute from "src"
 * Attribute "data-cc-name" is mandatory, and it must have the Cookie.name as value
 * @param {string} cookieName
 */
export function disableCookieIframes(cookieName: string) {
  const $iframes: NodeListOf<HTMLIFrameElement> = document.querySelectorAll(`iframe[data-cc-name="${cookieName}"]`);
  
  for (const $iframe of $iframes) {
    if ($iframe.hasAttribute('src')) {
      $iframe.setAttribute('data-cc-src', $iframe.src);
    }
  }
}