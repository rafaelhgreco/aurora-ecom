require("@testing-library/jest-dom");

if (typeof global.structuredClone !== "function") {
  global.structuredClone = function structuredClone(obj) {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
}
