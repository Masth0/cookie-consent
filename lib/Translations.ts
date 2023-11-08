import { CardMessages } from "./ui/CardElement.ts";

/**
 * LanguageCode
 * @Source https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 * @Source https://fr.wikipedia.org/wiki/Liste_des_codes_ISO_639-1
 */
export enum LanguageCode {
  Aa = "aa",
  Ab = "ab",
  Ae = "ae",
  Af = "af",
  Ak = "ak",
  Am = "am",
  An = "an",
  Ar = "ar",
  As = "as",
  Av = "av",
  Ay = "ay",
  Az = "az",
  Ba = "ba",
  Be = "be",
  Bg = "bg",
  Bh = "bh",
  Bi = "bi",
  Bm = "bm",
  Bn = "bn",
  Bo = "bo",
  Br = "br",
  Bs = "bs",
  Ca = "ca",
  Ce = "ce",
  Ch = "ch",
  Co = "co",
  Cr = "cr",
  Cs = "cs",
  Cu = "cu",
  Cv = "cv",
  Cy = "cy",
  Da = "da",
  De = "de",
  Dv = "dv",
  Dz = "dz",
  Ee = "ee",
  El = "el",
  En = "en",
  Eo = "eo",
  Es = "es",
  Et = "et",
  Eu = "eu",
  Fa = "fa",
  Ff = "ff",
  Fi = "fi",
  Fj = "fj",
  Fo = "fo",
  Fr = "fr",
  Fy = "fy",
  Ga = "ga",
  Gd = "gd",
  Gl = "gl",
  Gn = "gn",
  Gu = "gu",
  Gv = "gv",
  Ha = "ha",
  He = "he",
  Hi = "hi",
  Ho = "ho",
  Hr = "hr",
  Ht = "ht",
  Hu = "hu",
  Hy = "hy",
  Hz = "hz",
  Ia = "ia",
  Id = "id",
  Ie = "ie",
  Ig = "ig",
  Ii = "ii",
  Ik = "ik",
  Io = "io",
  Is = "is",
  It = "it",
  Iu = "iu",
  Ja = "ja",
  Jv = "jv",
  Ka = "ka",
  Kg = "kg",
  Ki = "ki",
  Kj = "kj",
  Kk = "kk",
  Kl = "kl",
  Km = "km",
  Kn = "kn",
  Ko = "ko",
  Kr = "kr",
  Ks = "ks",
  Ku = "ku",
  Kv = "kv",
  Kw = "kw",
  Ky = "ky",
  La = "la",
  Lb = "lb",
  Lg = "lg",
  Li = "li",
  Ln = "ln",
  Lo = "lo",
  Lt = "lt",
  Lu = "lu",
  Lv = "lv",
  Mg = "mg",
  Mh = "mh",
  Mi = "mi",
  Mk = "mk",
  Ml = "ml",
  Mn = "mn",
  Mo = "mo",
  Mr = "mr",
  Ms = "ms",
  Mt = "mt",
  My = "my",
  Na = "na",
  Nb = "nb",
  Nd = "nd",
  Ne = "ne",
  Ng = "ng",
  Nl = "nl",
  Nn = "nn",
  No = "no",
  Nr = "nr",
  Nv = "nv",
  Ny = "ny",
  Oc = "oc",
  Oj = "oj",
  Om = "om",
  Or = "or",
  Os = "os",
  Pa = "pa",
  Pi = "pi",
  Pl = "pl",
  Ps = "ps",
  Pt = "pt",
  Qu = "qu",
  Rm = "rm",
  Rn = "rn",
  Ro = "ro",
  Ru = "ru",
  Rw = "rw",
  Sa = "sa",
  Sc = "sc",
  Sd = "sd",
  Se = "se",
  Sg = "sg",
  Sh = "sh",
  Si = "si",
  Sk = "sk",
  Sl = "sl",
  Sm = "sm",
  Sn = "sn",
  So = "so",
  Sq = "sq",
  Sr = "sr",
  Ss = "ss",
  St = "st",
  Su = "su",
  Sv = "sv",
  Sw = "sw",
  Ta = "ta",
  Te = "te",
  Tg = "tg",
  Th = "th",
  Ti = "ti",
  Tk = "tk",
  Tl = "tl",
  Tn = "tn",
  To = "to",
  Tr = "tr",
  Ts = "ts",
  Tt = "tt",
  Tw = "tw",
  Ty = "ty",
  Ug = "ug",
  Uk = "uk",
  Ur = "ur",
  Uz = "uz",
  Ve = "ve",
  Vi = "vi",
  Vo = "vo",
  Wa = "wa",
  Wo = "wo",
  Xh = "xh",
  Yi = "yi",
  Yo = "yo",
  Za = "za",
  Zh = "zh",
  Zu = "zu",
}


export interface ScriptTagTranslations {
  categoryName: string;
  categoryDescription: string;
  cookieName: string;
  cookieDescription: string;
}

export function checkLanguageCode(code: LanguageCode | string) {
  if (!Object.keys(LanguageCode).includes(code)) {
    throw new Error(code + " is not an ISO 639-1 language code, adding translations aborted");
  }
}
//
// export function checkScriptTranslations(data: ScriptTagTranslations) {
//     const translations = JSON.parse(data);
// }

export const messages: { [key in LanguageCode | string]?: CardMessages } = {
  [LanguageCode.En]: {
    version: "",
    closeSettings: "Close settings",
    continueWithoutAccepting: "Continue without accepting",
    description: `We use cookies to enhance your browsing experience on our website. By continuing to use this site, you consent to the use of cookies in accordance with our Privacy Policy.`,
    openSettings: "Settings",
    reject: "Refuse all",
    save: "Save",
    acceptAll: "Accept all",
    title: "Cookie Consent",
  },
  [LanguageCode.Fr]: {
    version: "Nous avons mis à jours nos cookies.",
    closeSettings: "Fermer les préferences",
    continueWithoutAccepting: "Continuer sans accepter",
    description: `Nous utilisons des cookies pour améliorer votre expérience de navigation sur notre site web. En continuant à utiliser ce site, vous consentez à l'utilisation de cookies conformément à notre Politique de confidentialité.`,
    openSettings: "Préférences",
    reject: "Tout refuser",
    save: "Enregistrer",
    acceptAll: "Tout accepter",
    title: "Consentement aux Cookies",
  },
};