import { writeFile } from "node:fs/promises";

const [name, widthText, heightText = "812", route = "/", role] = process.argv.slice(2);
if (!name || !widthText)
  throw new Error("Usage: node review/capture.mjs name width [height] [route]");
const width = Number(widthText);
const height = Number(heightText);
const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("Edge page unavailable");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let nextId = 0;
const pending = new Map();
const exceptions = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown")
    exceptions.push(message.params.exceptionDetails.text);
  if (!message.id) return;
  const callback = pending.get(message.id);
  if (!callback) return;
  pending.delete(message.id);
  if (message.error) callback.reject(message.error);
  else callback.resolve(message.result);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 768,
});
await send("Page.navigate", {
  url: route.startsWith("file:")
    ? route
    : `http://127.0.0.1:8080${role ? `/login?next=${encodeURIComponent(route)}` : route}`,
});
await new Promise((resolve) => setTimeout(resolve, 1500));
if (role) {
  await send("Runtime.evaluate", {
    expression: `([...document.querySelectorAll('button')].find(button => button.textContent.includes(${JSON.stringify(`Masuk cepat: ${role}`)})) || (() => { throw new Error('Role button missing') })()).click()`,
  });
  await new Promise((resolve) => setTimeout(resolve, 700));
}
const metrics = await send("Runtime.evaluate", {
  expression: `(() => {const measure = selector => {const el=document.querySelector(selector); if(!el)return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};}; return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,brokenImages:[...document.images].filter(image=>image.complete&&image.naturalWidth===0).map(image=>image.src),search:measure('[data-review="search"]'),quick:measure('.home-quick-list'),banner:measure('[data-review="banner"]'),tile:measure('.home-category-picture'),featureImage:measure('.featured-card-image'),nav:measure('nav[aria-label="Navigasi bawah"]')};})()`,
  returnByValue: true,
});
const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
});
await writeFile(`review/${name}.png`, Buffer.from(screenshot.data, "base64"));
process.stdout.write(
  `${name}: ${JSON.stringify(metrics.result.value)} exceptions=${JSON.stringify(exceptions)}\n`,
);
socket.close();
