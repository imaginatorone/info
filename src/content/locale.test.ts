import { describe, expect, it } from "vitest";
import { detectLocale, dictionary } from "./locale";
describe("locale dictionary", () => {
  it("uses the preferred system language", () => {
    expect(detectLocale(["ru-RU", "en-US"])).toBe("ru");
    expect(detectLocale(["en-US", "ru-RU"])).toBe("en");
    expect(detectLocale(["fr"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });
  it("keeps both dictionaries complete and uses normal punctuation", () => {
    expect(Object.keys(dictionary.ru)).toEqual(Object.keys(dictionary.en));
    expect(JSON.stringify(dictionary)).not.toMatch(/[—–]/);
    expect(dictionary.ru.paragraphs).toHaveLength(3);
  });
});
