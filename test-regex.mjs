const patternStr =
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks|api/cron).*)";
const regex = new RegExp(patternStr);

const tests = [
  ["/_next/static/chunk.js", false],
  ["/_next/image/test.jpg", false],
  ["/favicon.ico", false],
  ["/image.png", false],
  ["/api/webhooks/stripe", false],
  ["/api/cron/test", false],
  ["/dashboard", true],
  ["/api/responses", true],
];

console.log("Pattern:", patternStr);
console.log("\nTest results:");
tests.forEach(([path, expected]) => {
  const result = regex.test(path);
  const status = result === expected ? "✓" : "✗";
  console.log(`${status} ${path}: expected ${expected}, got ${result}`);
});
