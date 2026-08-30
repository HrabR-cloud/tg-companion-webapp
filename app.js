/* Web App-форма: сценарии / персонажи / личности. Без лимитов символов. */
const tg = window.Telegram.WebApp;

const FORMS = {
  scenario: {
    create: "🎬 Новый сценарий",
    edit: "✏️ Редактирование сценария",
    fields: [
      ["name", "Название сценария *", "input", true],
      ["world_description", "Описание мира", "textarea", false],
      ["rules", "Правила и ограничения мира", "textarea", false],
      ["plot", "Сценарий / сюжет (порядок развития событий)", "textarea", false],
      ["greeting", "Приветствие (первая фраза при запуске)", "textarea", false],
    ],
  },
  character: {
    create: "🎭 Новый персонаж",
    edit: "✏️ Редактирование персонажа",
    fields: [
      ["name", "Имя персонажа *", "input", true],
      ["personality", "Личность и характер *", "textarea", true],
      ["appearance", "Внешность *", "textarea", true],
      ["world_description", "Место в мире", "textarea", false],
      ["speech_examples", "Характерные фразы, манера речи", "textarea", false],
      ["scenarios", "Роль и линии в сюжете", "textarea", false],
    ],
  },
  persona: {
    create: "👤 Новая личность",
    edit: "✏️ Редактирование личности",
    fields: [
      ["name", "Название личности *", "input", true],
      ["appearance", "Внешность", "textarea", false],
      ["description", "Личность", "textarea", false],
      ["speech_examples", "Характерные фразы образа", "textarea", false],
    ],
  },
};

const params = new URLSearchParams(location.search);
const type = params.get("type") || "scenario";
const mode = params.get("mode") === "edit" ? "edit" : "create";
const objId = params.get("id");
const scenarioId = params.get("scenario_id");
const form = FORMS[type] || FORMS.scenario;

// Построение формы
document.getElementById("title").textContent = mode === "edit" ? form.edit : form.create;
document.getElementById("hint").textContent = mode === "edit"
  ? "Пустые поля не изменяются. Заполненные — заменяют сохранённые."
  : "Объём текста не ограничен. * — обязательные поля.";

const box = document.getElementById("fields");
for (const [key, label, kind] of form.fields) {
  const div = document.createElement("div");
  div.className = "field";
  const tag = kind === "input" ? "input" : "textarea";
  div.innerHTML = `<label>${label}</label><${tag} id="f_${key}"></${tag}>`;
  box.appendChild(div);
}

tg.ready();
tg.expand();

tg.MainButton.text = "💾 Сохранить";
tg.MainButton.show();
tg.MainButton.onClick(() => {
  const fields = {};
  let ok = true;
  for (const [key, , , required] of form.fields) {
    const el = document.getElementById("f_" + key);
    fields[key] = el.value.trim();
    el.classList.remove("err");
    if (mode === "create" && required && !fields[key]) {
      el.classList.add("err");
      ok = false;
    }
  }
  if (!ok) { tg.showAlert("Заполни обязательные поля, помеченные *"); return; }

  const payload = {
    type, mode,
    id: objId ? parseInt(objId, 10) : null,
    scenario_id: scenarioId ? parseInt(scenarioId, 10) : null,
    fields,
  };
  sendChunked(JSON.stringify(payload));
});

/* Чанкование: обходим лимит sendData 4096 — размер текста не ограничен */
function sendChunked(str) {
  const CHUNK = 3000;
  const sid = Math.random().toString(36).slice(2, 10);
  const n = Math.max(1, Math.ceil(str.length / CHUNK));
  for (let i = 0; i < n; i++) {
    tg.sendData(JSON.stringify({
      k: "chunk", sid, i, n,
      d: str.slice(i * CHUNK, (i + 1) * CHUNK),
    }));
  }
  tg.MainButton.hide();
  setTimeout(() => tg.close(), 600);
}