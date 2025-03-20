"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FRENCH_LANGUAGES = exports.DEFAULT_CHINESE_LANGUAGES = exports.LanguageCode = exports.Language = void 0;
var Language;
(function (Language) {
    Language["CHINESE"] = "Chinese";
    Language["PINYIN"] = "Pinyin";
    Language["ENGLISH"] = "English";
    Language["FRENCH"] = "French";
})(Language || (exports.Language = Language = {}));
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["CHINESE"] = "zh";
    LanguageCode["ENGLISH"] = "en";
    LanguageCode["FRENCH"] = "fr";
})(LanguageCode || (exports.LanguageCode = LanguageCode = {}));
exports.DEFAULT_CHINESE_LANGUAGES = [Language.CHINESE, Language.PINYIN, Language.ENGLISH];
exports.DEFAULT_FRENCH_LANGUAGES = [Language.FRENCH, Language.ENGLISH];
//# sourceMappingURL=languages.js.map