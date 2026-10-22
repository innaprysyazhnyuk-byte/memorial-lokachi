const grid = document.getElementById("heroes-grid");
const search = document.getElementById("search");
const connection = document.getElementById("connection");
const year = document.getElementById("year");
const count = document.getElementById("result-count");
const empty = document.getElementById("empty-state");
const dialog = document.getElementById("hero-dialog");
const dialogContent = document.getElementById("dialog-content");

const approvedHeroes = HEROES.filter(h => h.approvedForPublication === true);
const years = [...new Set(approvedHeroes.map(h => h.deathYear).filter(Boolean))].sort((a,b) => b-a);
years.forEach(y => {
  const option = document.createElement("option");
  option.value = y;
  option.textContent = y;
  year.appendChild(option);
});

function safeText(value) {
  return String(value || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}
function initials(name) {
  return String(name || "✦").split(/\s+/).slice(0,2).map(p => p[0] || "").join("").toUpperCase();
}
function portrait(h, className = "portrait") {
  if (h.photo) return `<img class="${className}" src="${safeText(h.photo)}" alt="Фото: ${safeText(h.name)}" loading="lazy">`;
  return `<div class="${className}" aria-label="Фото не додано">${safeText(initials(h.name))}</div>`;
}
function lifeYears(h) {
  if (h.birthYear && h.deathYear) return `${safeText(h.birthYear)} — ${safeText(h.deathYear)}`;
  if (h.deathYear) return `Загинув у ${safeText(h.deathYear)} році`;
  return "Світла пам’ять";
}
function render() {
  const q = search.value.trim().toLocaleLowerCase("uk");
  const c = connection.value;
  const y = year.value;
  const filtered = approvedHeroes.filter(h => {
    const haystack = [h.name, h.summary, h.graduationYear, h.connection].join(" ").toLocaleLowerCase("uk");
    return (!q || haystack.includes(q)) &&
      (!c || h.connection === c) &&
      (!y || String(h.deathYear) === y);
  });
  count.textContent = `Знайдено: ${filtered.length}`;
  empty.hidden = filtered.length > 0;
  grid.innerHTML = filtered.map(h => `
    <article class="hero-card">
      ${portrait(h)}
      <div class="card-body">
        <span class="card-tag">${safeText(h.connection || "Герой ліцею")}</span>
        <h3>${safeText(h.name)}</h3>
        <p class="card-years">${lifeYears(h)}</p>
        <p class="card-summary">${safeText(h.summary)}</p>
        <div class="card-actions">
          <button type="button" data-open="${safeText(h.id)}">Історія Героя</button>
          <button type="button" data-qr="${safeText(h.id)}">QR-код</button>
        </div>
      </div>
    </article>`).join("");
}
function openHero(id, showQr = false) {
  const h = approvedHeroes.find(item => item.id === id);
  if (!h) return;
  const url = new URL(window.location.href);
  url.searchParams.set("hero", h.id);
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(url.toString());
  dialogContent.innerHTML = `
    <div class="dialog-inner">
      ${portrait(h)}
      <span class="card-tag">${safeText(h.connection || "Герой ліцею")}</span>
      <h2>${safeText(h.name)}</h2>
      <p class="dialog-meta">${lifeYears(h)}${h.graduationYear ? " · Рік випуску: " + safeText(h.graduationYear) : ""}</p>
      ${h.role ? `<p>${safeText(h.role)}</p>` : ""}
      ${h.biography ? `<section class="dialog-section"><h3>Життєвий шлях</h3><p>${safeText(h.biography)}</p></section>` : ""}
      ${h.service ? `<section class="dialog-section"><h3>Військовий шлях</h3><p>${safeText(h.service)}</p></section>` : ""}
      ${h.remembrance ? `<section class="dialog-section"><h3>Пам’ять</h3><p>${safeText(h.remembrance)}</p></section>` : ""}
      ${showQr ? `<section class="dialog-section"><h3>QR-код цієї сторінки</h3><p>Після публікації сайту цей код вестиме на сторінку Героя.</p><img class="qr-image" src="${qrUrl}" alt="QR-код сторінки ${safeText(h.name)}"><a href="${qrUrl}" target="_blank" rel="noopener">Відкрити зображення QR-коду</a><p class="qr-note">Перед друком обов’язково перевірте код на телефоні після публікації сайту.</p></section>` : ""}
    </div>`;
  dialog.showModal();
  history.replaceState(null, "", url.toString());
}
grid.addEventListener("click", e => {
  const openButton = e.target.closest("[data-open]");
  const qrButton = e.target.closest("[data-qr]");
  if (openButton) openHero(openButton.dataset.open);
  if (qrButton) openHero(qrButton.dataset.qr, true);
});
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
[search, connection, year].forEach(el => el.addEventListener("input", render));
render();

// Direct link support: https://your-site.example/?hero=unique-id
const requestedId = new URLSearchParams(window.location.search).get("hero");
if (requestedId && approvedHeroes.some(h => h.id === requestedId)) openHero(requestedId);
