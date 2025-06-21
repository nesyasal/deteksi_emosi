const express = require("express");
const path = require("path");
const fs = require("fs");
const detectEmotion = require("./utils/detectEmotion");

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const logPath = path.join(__dirname, "data", "chat-log.json");

const tasksPath = path.join(__dirname, "data", "tasks.json");

fs.writeFileSync(logPath, JSON.stringify([]));

// Endpoint untuk deteksi emosi dan simpan chat
app.post("/api/message", (req, res) => {
  const { user, text } = req.body;
  const emotion = detectEmotion(text); // Ini pemanggilan yang benar

  const chatEntry = { user, text, emotion, timestamp: new Date() };

  // Simpan ke file log
  const log = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath))
    : [];
  log.push(chatEntry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  res.json(chatEntry);
});

// app.post("/api/start-session", (req, res) => {
//   fs.writeFileSync(logPath, JSON.stringify([]));
//   res.json({ message: "Diskusi baru dimulai." });
// });

app.post("/api/end-session", (req, res) => {
  const { elapsedSeconds } = req.body;
  const durationMin = Math.round((elapsedSeconds || 0) / 60);

  const chatLog = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath))
    : [];
  if (chatLog.length === 0) return res.json({ summary: "Diskusi kosong." });

  const emotionCounts = {};
  chatLog.forEach((entry) => {
    const e = entry.emotion;
    emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  });

  console.log("Emosi terdeteksi:", emotionCounts);

  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
  const dominant = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  let moodSummary = "berlangsung dengan netral";
  if (dominant === "suasana_positif_dan_damai") {
    moodSummary = "berlangsung dengan damai dan positif";
  } else if (dominant === "suasana_menegangkan") {
    const positive = emotionCounts["suasana_positif_dan_damai"] || 0;
    const menegangkan = emotionCounts["suasana_menegangkan"] || 0;

    if (positive > 0 && menegangkan > 0 && menegangkan >= positive) {
      moodSummary =
        "sempat berlangsung menegangkan namun kembali positif dan damai";
    } else {
      moodSummary = "berlangsung menegangkan";
    }
  }

  console.log("Dominan:", dominant);
  console.log("Ringkasan:", moodSummary);

  const summary = `Diskusi berakhir selama ${durationMin} menit\nSuasana ${moodSummary}`;
  res.json({ summary });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

// GET semua tugas
app.get("/api/tasks", (req, res) => {
  const tasks = fs.existsSync(tasksPath)
    ? JSON.parse(fs.readFileSync(tasksPath))
    : [];
  res.json(tasks);
});

// POST tugas baru
app.post("/api/tasks", (req, res) => {
  const task = req.body;
  const tasks = fs.existsSync(tasksPath)
    ? JSON.parse(fs.readFileSync(tasksPath))
    : [];
  tasks.push(task);
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  res.status(201).json({ message: "Task added" });
});

// PUT update status tugas
app.put("/api/tasks/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const tasks = fs.existsSync(tasksPath)
    ? JSON.parse(fs.readFileSync(tasksPath))
    : [];

  if (index >= 0 && index < tasks.length) {
    tasks[index].status = req.body.status;
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    res.json({ message: "Task updated" });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
