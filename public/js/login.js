document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (res.ok) {
      // Simpan nama lengkap user ke localStorage
      if (result.user && result.user.fullname) {
        localStorage.setItem("fullname", result.user.fullname);
      }
      // Redirect to chat page on successful login
      window.location.href = "/chat.html";
    } else {
      status.textContent = result.message || "Login gagal.";
      status.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Login error:", err);
    status.textContent = "Terjadi kesalahan jaringan.";
    status.classList.remove("hidden");
  }
});
