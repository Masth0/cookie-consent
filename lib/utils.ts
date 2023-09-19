/**
 * Get value of a cookie
 */
export function getCookieValue(name: string): string | undefined {
  const value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  return parts.length < 2 ? undefined : parts.pop()?.split(";").shift();
}

export function getAllCookies(): Array<{ name: string; value: string }> {
  return document.cookie.split(";").map((str) => {
    const [name, value] = str.split("=").map((v) => v.trim());
    return { name, value };
  });
}

export function createCustomEvent(name: string, detail: any): CustomEvent {
  return new CustomEvent(name, {
    detail: {
      ...detail,
    },
  });
}

export function isAttributeValid(attrValue: undefined | null | string): boolean {
  return attrValue !== "" || (attrValue !== undefined && attrValue !== null);
}

export function validateLanguageTag(tag: string): boolean {
  // Regular expression pattern for BCP 47 language tags
  const pattern: RegExp = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;

  // Check if the tag matches the pattern
  return pattern.test(tag);
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

export function strToId(str: string): string {
  const _str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Replace spaces and special characters with underscores
  const id: string = _str.replace(/[^\w-]+/g, "_");

  // Remove leading numbers or underscores from the ID
  const cleanedId: string = id.replace(/^[0-9_-]+/, "");

  // Make sure the ID starts with a letter
  const finalId: string = cleanedId.replace(/^([^a-zA-Z])/, "id_$1");

  return finalId.toLowerCase();
}
