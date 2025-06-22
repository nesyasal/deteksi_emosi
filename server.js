const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const detectEmotion = require("./utils/detectEmotion");

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const usersPath = path.join(__dirname, "data", "users.json");
const logPath = path.join(__dirname, "data", "chat-log.json");
const tasksPath = path.join(__dirname, "data", "tasks.json");
const feedbackPath = path.join(__dirname, "data", "feedback-log.json");

if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, "[]");

fs.writeFileSync(logPath, JSON.stringify([]));

// Endpoint untuk registrasi pengguna
app.post("/api/register", (req, res) => {
  const { fullname, email, phone, password } = req.body;

  if (!fullname || !email || !phone || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi." });
  }

  const users = fs.existsSync(usersPath)
    ? JSON.parse(fs.readFileSync(usersPath))
    : [];

  const userExists = users.find((user) => user.email === email);
  if (userExists) {
    return res
      .status(409)
      .json({ success: false, message: "Email sudah terdaftar." });
  }

  const hashedPassword = bcrypt.hashSync(password, 10); // ✅ simpan password aman
  users.push({ fullname, email, phone, password: hashedPassword });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  console.log("✅ User berhasil didaftarkan:", fullname);
  return res.json({ success: true });
});

// Endpoint untuk login pengguna
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email dan password wajib diisi." });

  const users = fs.existsSync(usersPath)
    ? JSON.parse(fs.readFileSync(usersPath))
    : [];
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Email tidak ditemukan." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: "Password salah." });
  }

  // Login berhasil
  res.json({
    success: true,
    user: { fullname: user.fullname, email: user.email },
  });

  console.log("📩 Menerima permintaan login:", email);
});

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

// Endpoint kirim umpan balik
app.post("/api/feedback", (req, res) => {
  const { receiver, message, anonymous, sender } = req.body;
  // Gunakan sender dari client jika ada dan tidak anonymous
  const senderName = anonymous ? "Anonymous" : sender || "User";

  const feedback = {
    receiver,
    sender: senderName,
    message,
    anonymous,
    timestamp: new Date(),
  };

  const log = fs.existsSync(feedbackPath)
    ? JSON.parse(fs.readFileSync(feedbackPath))
    : [];

  log.push(feedback);
  fs.writeFileSync(feedbackPath, JSON.stringify(log, null, 2));

  res.json({ success: true });
});

// Endpoint ambil semua umpan balik
app.get("/api/feedback", (req, res) => {
  const log = fs.existsSync(feedbackPath)
    ? JSON.parse(fs.readFileSync(feedbackPath))
    : [];

  res.json(log);
});

app.get("/api/analytics", (req, res) => {
  const chatLog = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath))
    : [];

  const tasksPath = path.join(__dirname, "data", "tasks.json");
  const tasks = fs.existsSync(tasksPath)
    ? JSON.parse(fs.readFileSync(tasksPath))
    : [];

  // Hitung total & hari ini (chat)
  const totalMessages = chatLog.length;
  const today = new Date().toISOString().split("T")[0];
  const todayMessages = chatLog.filter((entry) =>
    entry.timestamp.startsWith(today)
  ).length;

  // Hitung tugas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Waktu aktif dummy (bisa disesuaikan)
  const todayTime = "2h 30m";
  const weeklyTime = "12h 45m";

  res.json({
    totalMessages,
    todayMessages,
    totalTasks,
    completedTasks,
    completionRate,
    todayTime,
    weeklyTime,
  });
});

// Endpoint untuk ambil data suasana diskusi (30 hari terakhir)
app.get("/api/mood-data", (req, res) => {
  const logPath = path.join(__dirname, "data", "chat-log.json");
  const chatLog = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath))
    : [];

  const moodByDate = {};

  chatLog.forEach(({ timestamp, emotion }) => {
    const date = new Date(timestamp).toISOString().split("T")[0]; // yyyy-mm-dd
    if (!moodByDate[date]) {
      moodByDate[date] = { damai: 0, menegangkan: 0, netral: 0 };
    }

    if (emotion === "suasana_positif_dan_damai") {
      moodByDate[date].damai++;
    } else if (emotion === "suasana_menegangkan") {
      moodByDate[date].menegangkan++;
    } else {
      moodByDate[date].netral++;
    }
  });

  // Ambil 30 hari terakhir
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    return d.toISOString().split("T")[0];
  });

  const result = last30Days.map((date) => ({
    date,
    ...moodByDate[date],
  }));

  res.json(result);
});
