// nav.js
// Builds the shared sidebar and injects it into every page's #nav-placeholder div.

function renderNav() {
  const links = [
    { href: "index.html", label: "Dashboard" },
    { href: "leads.html", label: "Leads" },
    { href: "pipeline.html", label: "Pipeline" },
    { href: "messages.html", label: "Messages" },
    { href: "proposals.html", label: "Proposals" },
    { href: "vendors.html", label: "Vendors" },
    { href: "finance.html", label: "Finance" },
    { href: "staff.html", label: "Staff" },
    { href: "support.html", label: "Support" },
    { href: "analytics.html", label: "Analytics" },
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const linksHTML = links
    .map((link) => {
      const activeClass = link.href === currentPage ? "active" : "";
      return `<a href="${link.href}" class="nav-link ${activeClass}">${link.label}</a>`;
    })
    .join("");

  const navHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-dot"></span>
        <span>Travel CRM</span>
      </div>
      <nav class="nav-links">${linksHTML}</nav>
      <button id="logoutBtn" class="nav-logout">Log out</button>
    </aside>
  `;

  const placeholder = document.getElementById("nav-placeholder");
  if (placeholder) placeholder.innerHTML = navHTML;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", renderNav);