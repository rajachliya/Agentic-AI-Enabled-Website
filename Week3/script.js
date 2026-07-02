import { GoogleGenAI } from "@google/genai";

// Vite exposes .env vars prefixed with VITE_ via import.meta.env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const goalInput = document.getElementById("goalInput");
const generateBtn = document.getElementById("generateBtn");
const statusMsg = document.getElementById("statusMsg");
const generatedTasks = document.getElementById("generatedTasks");

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// ---------- Gemini goal -> steps ----------

generateBtn.addEventListener("click", generatePlan);
goalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generatePlan();
});

async function generatePlan() {
  const goal = goalInput.value.trim();
  if (!goal) {
    setStatus("Please enter a goal first.", "error");
    return;
  }

  setStatus("Generating your plan...", "loading");
  generatedTasks.innerHTML = "";
  generateBtn.disabled = true;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following goal into a clear, ordered list of
      actionable steps: "${goal}". For each step provide a short task name,
      a priority (High, Medium, or Low), and an estimated time to complete it
      (e.g. "30 mins", "2 hours", "1 day").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            tasks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  task_name: { type: "STRING" },
                  priority: { type: "STRING" },
                  estimated_time: { type: "STRING" },
                },
                required: ["task_name", "priority", "estimated_time"],
              },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text);
    renderGeneratedTasks(data.tasks || []);
    setStatus(`Plan generated: ${data.tasks?.length || 0} steps.`, "");
  } catch (err) {
    console.error(err);
    setStatus("Couldn't generate a plan right now. Please try again.", "error");
  } finally {
    generateBtn.disabled = false;
  }
}

function renderGeneratedTasks(tasks) {
  generatedTasks.innerHTML = "";
  tasks.forEach((task) => {
    const card = document.createElement("div");
    const priorityClass = `priority-${(task.priority || "").toLowerCase()}`;
    card.className = `gen-task-card ${priorityClass}`;
    card.innerHTML = `
      <div class="task-name">${escapeHtml(task.task_name)}</div>
      <div class="task-meta">Priority: ${escapeHtml(task.priority)} · Est. time: ${escapeHtml(task.estimated_time)}</div>
    `;
    generatedTasks.appendChild(card);
  });
}

function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = "status-msg" + (type ? ` ${type}` : "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Week 2 manual task manager ----------

addTaskBtn.addEventListener("click", addManualTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addManualTask();
});

function addManualTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const completeBtn = document.createElement("button");
  completeBtn.textContent = "Done";
  completeBtn.addEventListener("click", () => li.classList.toggle("completed"));

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => li.remove());

  actions.appendChild(completeBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(actions);
  taskList.appendChild(li);

  taskInput.value = "";
}
