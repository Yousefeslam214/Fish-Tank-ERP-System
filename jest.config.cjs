module.exports = {
  // يخبر Jest أنه سيعمل في بيئة تشبه المتصفح (مهم جداً لـ React)
  testEnvironment: "jsdom", 

  // يخبر Jest باستخدام Babel لتحويل ملفات الـ JS والـ JSX والـ TS والـ TSX
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  // يخبر Jest بكيفية التعامل مع ملفات الـ CSS والصور (يتجاهلها لكي لا ينهار الاختبار)
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/__mocks__/fileMock.js",
  },

  // إعدادات إضافية لتسهيل التعامل مع DOM
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};