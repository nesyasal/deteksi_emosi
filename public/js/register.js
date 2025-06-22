document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Konfirmasi password tidak cocok!");
    return;
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email, phone, password }),
    });

    const result = await response.json();

    if (result.success) {
      alert("Registrasi berhasil!");
      e.target.reset(); // Clear form input
    } else {
      alert(result.message || "Terjadi kesalahan saat registrasi.");
    }
  } catch (error) {
    console.error("❌ Gagal registrasi:", error);
    alert("Terjadi kesalahan jaringan.");
  }
});
