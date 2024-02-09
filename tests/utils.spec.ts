import { test, expect } from '@playwright/test';
import { strToId } from "../lib/ui/helpers";
import { arrayToMap, getCookieValue, isAttributeValid } from "../lib/utils.ts";


test.describe('Test utils functions', () => {
  test("Google analytics to be equal to google_analytics", async () => {
    expect(strToId('Google Analytics')).toBe('google_analytics')
  })
  
  test("Verify attribute value, return true only when attrValue is a string of length > 0 or !== 'NaN'", () => {
    expect(isAttributeValid(undefined)).toBeFalsy();
    expect(isAttributeValid(null)).toBeFalsy();
    expect(isAttributeValid('NaN')).toBeFalsy();
    expect(isAttributeValid('')).toBeFalsy();
    expect(isAttributeValid('valid')).toBeTruthy();
  })
  
  test('Convert an array with object to a map', () => {
    const result = new Map();
    result.set('John Doe', {name: 'John Doe', data: {}});
    result.set('Anne Orak', {name: 'Anne Orak', data: {isCrazy: true}});
    
    const testValue = [{name: 'John Doe', data: {}}, {name: 'Anne Orak', data: {isCrazy: true}}];
    expect(arrayToMap<{ name: string, data: any }>(testValue, 'name'))
      .toEqual(result)
  })
  
  test("Parse document.cookie", async ({ page, context}) => {
    const cookieValue: string = "test value"
    
    await page.goto("http://localhost:8888")
    await page.context().addCookies([{
      name: '_cookie_consent',
      value: cookieValue,
      path: '/',
      domain: 'localhost:8888',
      expires: -1
    }])
    await page.waitForLoadState("load")
    await page.exposeFunction('getCookieValue', getCookieValue)
    
    const result = await page.evaluate(`(async () => {
      const { getCookieValue } = await import('../lib/utils.ts');
      console.log('TOTO', getCookieValue)
      return Promise.resolve(getCookieValue('_cookie_consent'))
    })()`);
    
    expect(result).toBe(cookieValue);
  })
  
})