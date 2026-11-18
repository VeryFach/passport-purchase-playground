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
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const check = (condition, message) => {
  if (!condition) throw new Error(message);
  process.stdout.write(`PASS ${message}\n`);
};
try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 376,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:8080/" });
  await wait(900);
  const initial = await evaluate(`({
    nav: [...document.querySelectorAll('nav[aria-label="Navigasi bawah"] a')].map(a => a.textContent.trim()),
    categories: document.querySelectorAll('.home-category-item').length,
    listings: document.querySelectorAll('.featured-card').length,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length
  })`);
  check(initial.nav.join(",") === "Beranda,Perangkat,Aktivitas,Akun", "navigasi mobile empat item");
  check(initial.categories === 4 && initial.listings >= 1, "kategori dan listing tampil");
  check(
    initial.scrollWidth === initial.innerWidth && initial.broken === 0,
    "tanpa overflow atau gambar rusak",
  );

  await evaluate(
    `(() => { const input = document.querySelector('input[aria-label="Cari perangkat"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'MacBook'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`,
  );
  await wait();
  const searchResult = await evaluate(
    `({count:document.querySelectorAll('.featured-card').length,text:document.querySelector('.home-all-heading p')?.textContent})`,
  );
  check(
    searchResult.count === 2 && searchResult.text.includes("2 listing"),
    "pencarian memperbarui listing",
  );

  await evaluate(`document.querySelector('button[aria-label^="Buka filter"]').click()`);
  await wait();
  check(await evaluate(`!!document.querySelector('[role="dialog"]')`), "filter terbuka");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await wait();
  check(
    !(await evaluate(`!!document.querySelector('[role="dialog"]')`)),
    "filter tertutup dengan Escape",
  );
  await evaluate(
    `(() => { const input = document.querySelector('input[aria-label="Cari perangkat"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); })()`,
  );
  await wait();
  await evaluate(`document.querySelector('button[aria-label="Lihat Smartphone"]').click()`);
  await wait();
  const categoryResult = await evaluate(
    `({pressed:document.querySelector('button[aria-label="Lihat Smartphone"]').getAttribute('aria-pressed'),count:document.querySelectorAll('.featured-card').length})`,
  );
  check(
    categoryResult.pressed === "true" && categoryResult.count === 3,
    "kategori HP menyaring listing",
  );

  await evaluate(`document.querySelector('input[aria-label="Cari perangkat"]').focus()`);
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  check(
    await evaluate(`document.activeElement?.getAttribute('aria-label')?.startsWith('Buka filter')`),
    "filter dapat dicapai dengan keyboard",
  );

  const targets = await evaluate(`({
    search: (() => {const r=document.querySelector('[data-review="search"]').getBoundingClientRect();return [r.width,r.height]})(),
    tiles: [...document.querySelectorAll('.home-category-item')].map(el=>{const r=el.getBoundingClientRect();return [r.width,r.height]})
  })`);
  check(
    targets.search[1] >= 48 && targets.tiles.every(([, height]) => height >= 80),
    "area sentuh utama memadai",
  );
  await send("Page.navigate", {
    url: "http://127.0.0.1:8080/login?next=%2Fdevices%2Fnew",
  });
  await wait(700);
  await evaluate(
    `([...document.querySelectorAll('button')].find(button => button.textContent.includes('Masuk cepat: Penjual')) || (() => { throw new Error('Tombol demo Penjual hilang') })()).click()`,
  );
  await wait(500);
  check(
    await evaluate(
      `location.pathname === '/devices/new' && !!document.querySelector('.form-sticky-actions')`,
    ),
    "alur demo Penjual mencapai formulir",
  );
  await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
  await wait();
  const formBottom = await evaluate(`({
    navTop: document.querySelector('nav[aria-label="Navigasi bawah"]').getBoundingClientRect().top,
    actionBottom: document.querySelector('.form-sticky-actions').getBoundingClientRect().bottom,
    atBottom: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight
  })`);
  check(
    formBottom.atBottom && formBottom.actionBottom <= formBottom.navTop + 1,
    "aksi formulir tidak tertutup navigasi bawah",
  );
  check(exceptions.length === 0, "tanpa exception runtime");
} finally {
  socket.close();
}
