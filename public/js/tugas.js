async function loadTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-2">${task.task}</td>
      <td class="p-2">${task.deadline}</td>
      <td class="p-2">${task.assignee}</td>
      <td class="p-2">
        <select onchange="updateStatus(${index}, this.value)" class="border p-1 rounded">
          <option value="Not Started" ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
          <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function createTask() {
  const task = document.getElementById("taskName").value.trim();
  const deadline = document.getElementById("deadline").value;
  const assignee = document.getElementById("assignee").value.trim();

  if (!task || !deadline || !assignee) {
    alert("Harap lengkapi semua kolom!");
    return;
  }

  const newTask = { task, deadline, assignee, status: "Not Started" };

  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTask),
  });

  document.getElementById("taskName").value = "";
  document.getElementById("deadline").value = "";
  document.getElementById("assignee").value = "";
  loadTasks();
}

async function updateStatus(index, newStatus) {
  await fetch(`/api/tasks/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  loadTasks();
}

loadTasks();
