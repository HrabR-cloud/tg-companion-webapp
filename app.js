/* Web App-форма v3: префилл и сохранение через локальный API бота (ngrok). */
const tg = window.Telegram.WebApp;
const params = new URLSearchParams(location.search);
const API = (params.get("api") || "").replace(/\/+$/, "");
const TOKEN = params.get("token") || "";
const type = params.get("type") || "scenario";
const mode = params.get("mode") === "edit" ? "edit" : "create";
const objId = params.get("id");
const scenarioId = params.get("scenario_id");

const H = { "ngrok-skip-browser-warning": "1" };

const FORMS = {
  scenario: {
    create: "🎬 Новый сценарий", edit: "✏️ Редактирование сценария",
    fields: [
      ["name", "Название сценария *", "input", true, "Например: Хогвартс, школа исполнения тайных желаний"],
      ["world_description", "Описание мира", "textarea", false, "Эпоха, география, атмосфера, магия/технологии, ключевые места..."],
      ["rules", "Правила и ограничения мира", "textarea", false, "Что возможно и что запрещено; законы магии; ограничения, которые соблюдают персонажи..."],
      ["plot", "Сценарий / сюжет (порядок событий)", "textarea", false, "Как развиваются события: завязка..., развитие..., ключевые повороты..."],
      ["greeting", "Приветствие (первая фраза при запуске)", "textarea", false, "Стартовая сцена, задающая настроение. Например: Ветер срывает листву, когда ворота школы распахиваются перед тобой..."],
    ],
  },
  character: {
    create: "🎭 Новый персонаж", edit: "✏️ Редактирование персонажа",
    fields: [
      ["name", "Имя персонажа *", "input", true, "Например: Гермиона Грейнджер"],
      ["personality", "Личность и характер *", "textarea", true, "Привычки, страхи, цели, ценности, манера общения, сильные и слабые стороны..."],
      ["appearance", "Внешность *", "textarea", true, "Рост, телосложение, волосы, глаза, одежда, особые приметы, возраст..."],
      ["world_description", "Место в мире", "textarea", false, "Кем он является в этом мире: род занятий, статус, связи, секреты..."],
      ["speech_examples", "Характерные фразы, манера речи", "textarea", false, "Любимые обороты, фирменные фразы, примеры реплик: ..."],
      ["scenarios", "Роль и линии в сюжете", "textarea", false, "Функция персонажа в истории, отношения с протагонистом, возможные ветки..."],
    ],
  },
  persona: {
    create: "👤 Новая личность", edit: "✏️ Редактирование личности",
    fields: [
      ["name", "Название личности *", "input", true, "Например: Женя-пират"],
      ["appearance", "Внешность", "textarea", false, "Как выглядит твой образ: одежда, телосложение, приметы..."],
      ["description", "Личность", "textarea", false, "Характер, привычки, предыстория этого образа..."],
    ],
  },
};

const form = FORMS[type] || FORMS.scenario;
document.getElementById("title").textContent = mode === "edit" ? form.edit : form.create;
document.getElementById("hint").textContent = mode === "edit"
  ? "Загружены сохранённые данные. Меняй нужное и нажимай Сохранить."
  : "Объём текста не ограничен. * — обязательные поля.";

const box = document.getElementById("fields");
for (const [key, label, kind, , ph] of form.fields) {
  const div = document.createElement("div");
  div.className = "field";
  const tag = kind === "input" ? "input" : "textarea";
  div.innerHTML = `<label>${label}</label><${tag} id="f_${key}" placeholder="${ph || ""}"></${tag}>`;
  box.appendChild(div);
}

tg.ready();
tg.expand();

// ---- префилл при редактировании ----
if (mode === "edit" && objId && API) {
  fetch(`${API}/api/prefill?type=${type}&id=${objId}&token=${TOKEN}`, { headers: H })
    .then(r => r.json())
    .then(data => {
      for (const [key] of form.fields) {
        const v = (data.fields || {})[key];
        if (v) document.getElementById("f_" + key).value = v;
      }
    })
    .catch(() => tg.showAlert("Не удалось загрузить сохранённые данные. Бот и ngrok запущены?"));
}

tg.MainButton.text = "💾 Сохранить";
tg.MainButton.show();
tg.MainButton.onClick(async () => {
  const fields = {};
  let ok = true;
  for (const [key, , , required] of form.fields) {
    const el = document.getElementById("f_" + key);
    fields[key] = el.value.trim();
    el.classList.remove("err");
    if (mode === "create" && required && !fields[key]) { el.classList.add("err"); ok = false; }
  }
  if (!ok) { tg.showAlert("Заполни обязательные поля, помеченные *"); return; }
  if (!API) { tg.showAlert("Нет адреса API (параметр api). Пересоздай кнопку после настройки .env"); return; }

  const payload = {
    type, mode,
    id: objId ? parseInt(objId, 10) : null,
    scenario_id: scenarioId ? parseInt(scenarioId, 10) : null,
    fields,
  };
  try {
    const resp = await fetch(`${API}/api/save?token=${TOKEN}`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await resp.json();
    if (res.ok) {
      tg.showPopup({ title: "Сохранено", message: "Данные отправлены боту.",
                     buttons: [{ type: "close", label: "ОК" }] });
      setTimeout(() => tg.close(), 300);
    } else {
      tg.showAlert(res.error || "Не удалось сохранить.");
    }
  } catch (e) {
    tg.showAlert("Не удалось связаться с сервером. Проверь, что бот и ngrok запущены.");
  }
});
