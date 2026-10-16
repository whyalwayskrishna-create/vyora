// Quick sanity checks: node src/lib/nutrition.test.mjs
const scale = (per100, g) => (per100 * g) / 100;
const assert = (c, m) => { if (!c) { console.error("FAIL", m); process.exit(1); } else console.log("ok", m); };
assert(scale(250, 150) === 375, "250 kcal/100g × 150 g = 375 kcal");
assert(Math.abs(scale(31, 172) - 53.32) < 1e-9, "chicken protein 172g");
assert(scale(100, 0) === 0, "zero grams");
