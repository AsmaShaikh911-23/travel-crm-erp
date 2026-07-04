// auth.js
// Include this on every protected page (everything except login.html).
// If there is no logged-in session, it redirects to the login page.

async function requireLogin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", requireLogin);