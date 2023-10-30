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
  const value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  return parts.length < 2 ? undefined : parts.pop()?.split(";").shift();
}
