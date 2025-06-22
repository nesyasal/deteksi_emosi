async function submitFeedback() {
  const receiver = document.getElementById("receiver").value.trim();
  const message = document.getElementById("message").value.trim();
  const anonymous = document.getElementById("anonymous").checked;
  // Ambil nama lengkap user dari localStorage
  const fullname = localStorage.getItem("fullname") || "User";

  if (!receiver || !message) return alert("Harap lengkapi semua kolom.");

  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiver, message, anonymous, sender: fullname }),
  });

  const data = await response.json();
  loadFeedback();
}

async function loadFeedback() {
  const res = await fetch("/api/feedback");
  const feedback = await res.json();

  const list = document.getElementById("feedbackList");
  list.innerHTML = "";

  feedback.reverse().forEach((fb) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>To:</strong> ${fb.receiver}</p>
      <p><strong>From:</strong> ${fb.anonymous ? "Anonymous" : fb.sender}</p>
      <p>${fb.message}</p>
      <p class="text-gray-500 text-xs">${new Date(
        fb.timestamp
      ).toLocaleString()}</p>
      <hr class="my-2">
    `;
    list.appendChild(div);
  });
}

window.onload = loadFeedback;
