document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginBtn");

  form.addEventListener("click", async (e) => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      if (data.role === "USER") {
        window.location.href = "http://localhost:3000/user";
      } else if (data.role === "ADMIN") {
        window.location.href = "http://localhost:3000/admin";
      }
    } else {
      alert(data.message);
    }

    e.preventDefault();
  });
});
