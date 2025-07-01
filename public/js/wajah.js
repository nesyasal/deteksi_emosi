// 🔁 Daftar saran global
const saranList = [
  "Coba ambil jeda sejenak untuk menenangkan diri.",
  "Mari kita jaga suasana tetap tenang dan produktif.",
  "Jika sedang kesal, beri waktu untuk berpikir jernih.",
  "Istirahat 1 menit bisa bantu atur ulang pikiran.",
  "Tim butuh semangat! Yuk beri dukungan positif.",
];

// 🔔 Tampilkan pop-up saran
function showPopupSuggestion() {
  const popup = document.getElementById("popupSuggestion");
  const popupText = document.getElementById("popupText");

  if (!popup || !popupText) return;

  popupText.textContent =
    saranList[Math.floor(Math.random() * saranList.length)];
  popup.classList.remove("hidden");

  // Sembunyikan setelah 5 detik
  setTimeout(() => {
    popup.classList.add("hidden");
  }, 5000);
}

// 🚀 Mulai deteksi setelah model dimuat
async function loadModelsAndStart() {
  console.log("📦 Memuat model online...");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector"
    ),
    faceapi.nets.faceExpressionNet.loadFromUri(
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression"
    ),
  ]);
  console.log("✅ Model berhasil dimuat");

  const video = document.getElementById("video");
  const canvas = document.getElementById("overlay");
  const emotionBox = document.getElementById("faceEmotion");

  navigator.mediaDevices
    .getUserMedia({ video: {} })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("❌ Gagal akses kamera:", err);
      alert("Kamera tidak bisa diakses.");
    });

  video.addEventListener("play", () => {
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const resized = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceExpressions(canvas, resized);

      if (resized.length > 0) {
        const expressions = resized[0].expressions;
        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        const topExpression = sorted[0][0];
        emotionBox.innerText = `Ekspresi: ${topExpression}`;

        // Tampilkan saran untuk emosi negatif
        const emosNegatif = ["angry", "sad", "disgusted"];
        if (emosNegatif.includes(topExpression)) {
          showPopupSuggestion();
        }
      }
    }, 1000);
  });
}

// Mulai saat halaman selesai dimuat
window.addEventListener("DOMContentLoaded", loadModelsAndStart);
