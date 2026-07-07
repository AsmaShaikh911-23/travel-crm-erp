// leads.js — MODULE 5: Lead CRUD

async function loadLeads() {
  const { data, error } = await supabaseClient.from("leads").select("*").order("id", { ascending: true });
  if (error) { console.error(error); return; }

  const tbody = document.getElementById("leadsTableBody");
  tbody.innerHTML = data.map((lead) => {
    const badgeClass = "badge-" + lead.status.replace(/\s+/g, "").toLowerCase();
    return `
      <tr>
        <td>${lead.name}</td>
        <td>${lead.phone}</td>
        <td>${lead.destination}</td>
        <td>₹${lead.budget}</td>
        <td>${lead.source || "-"}</td>
        <td><span class="badge ${badgeClass}">${lead.status}</span></td>
        <td>${lead.lead_score}</td>
      </tr>
    `;
  }).join("");
}

async function addLead(e) {
  e.preventDefault();

  const newLead = {
    name: document.getElementById("l_name").value,
    phone: document.getElementById("l_phone").value,
    email: document.getElementById("l_email").value,
    destination: document.getElementById("l_destination").value,
    budget: parseFloat(document.getElementById("l_budget").value),
    source: document.getElementById("l_source").value,
    status: "New",
    lead_score: 0
  };

  const { error } = await supabaseClient.from("leads").insert([newLead]);
  if (error) { alert("Could not add lead."); console.error(error); return; }

  document.getElementById("leadForm").reset();
  loadLeads();
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeads();
  document.getElementById("leadForm").addEventListener("submit", addLead);
});

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function getSettingValue(key) {
  const { data, error } = await supabaseClient
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data?.setting_value || null;
}

async function loadLatestScrape() {
  const el = document.getElementById("scrapeStatus");
  if (!el) return;

  const { data, error } = await supabaseClient.from("scrape_logs").select("*").order("created_at", { ascending: false }).limit(1);
  if (error) { console.error(error); el.textContent = "Error loading scrape status."; return; }

  const latest = data?.[0];
  el.textContent = latest
    ? `${latest.status || "Unknown"} · ${latest.source || "Unknown"} · ${formatDateTime(latest.created_at)}`
    : "No scrape activity yet.";
}

function badgeForStatus(status) {
  if (!status) return "badge-alert";
  const s = status.toString().toLowerCase();
  if (s.includes("success") || s.includes("completed") || s.includes("done")) return "badge-paid";
  if (s.includes("failed") || s.includes("error")) return "badge-lost";
  if (s.includes("running") || s.includes("processing") || s.includes("in_progress")) return "badge-reminder";
  return "badge";
}

async function loadScrapeHistory(limit = 25) {
  const tbody = document.getElementById("scrapeHistoryBody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading history…</td></tr>';

  const { data, error } = await supabaseClient.from("scrape_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Error loading history</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">No scrape history available.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((r) => {
    const time = formatDateTime(r.created_at);
    const source = r.source || "—";
    const status = r.status || "—";
    const notes = r.details || r.message || "";
    const badge = badgeForStatus(status);
    return `
      <tr>
        <td>${time}</td>
        <td>${source}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td>${notes}</td>
      </tr>
    `;
  }).join("");
}

async function triggerScrape() {
  const source = document.getElementById("scrapeSource")?.value || "all";
  const webhookUrl = await getSettingValue("n8n_webhook_url");
  const button = document.getElementById("scrapeLeadsBtn");

  if (!webhookUrl) {
    alert("Configure the n8n webhook URL in Settings first.");
    return;
  }

  // Read previous latest scrape timestamp so we can detect new activity
  let prevTime = null;
  try {
    const prev = await supabaseClient.from("scrape_logs").select("created_at").order("created_at", { ascending: false }).limit(1);
    prevTime = prev.data?.[0]?.created_at || null;
  } catch (e) {
    console.error(e);
  }

  if (button) {
    button.disabled = true;
    button.classList.add("loading");
    button.textContent = "Scraping...";
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scrape_leads", source, triggered_from: "erp_leads" })
    });
  } catch (error) {
    console.error(error);
    showToast("Could not trigger the scrape workflow.", "error");
    if (button) {
      button.disabled = false;
      button.classList.remove("loading");
      button.textContent = "Scrape Leads";
    }
    return;
  }

  // Poll scrape_logs for a new entry (or changed timestamp)
  const start = Date.now();
  const timeoutMs = 60000; // 60s timeout
  const intervalMs = 2500;

  const result = await new Promise((resolve) => {
    const id = setInterval(async () => {
      try {
        const res = await supabaseClient.from("scrape_logs").select("created_at,status,source").order("created_at", { ascending: false }).limit(1);
        const latest = res.data?.[0];
        if (latest && (!prevTime || new Date(latest.created_at) > new Date(prevTime))) {
          clearInterval(id);
          resolve({ found: true, latest });
          return;
        }
      } catch (e) {
        console.error(e);
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(id);
        resolve({ found: false });
      }
    }, intervalMs);
  });

  if (result.found) {
    await loadLeads();
    await loadLatestScrape();
    showToast("Scrape completed and leads refreshed.", "success");
  } else {
    // Fallback: update status and notify user
    await loadLatestScrape();
    showToast("Scrape triggered — processing may continue in the background.", "success");
  }

  if (button) {
    button.disabled = false;
    button.classList.remove("loading");
    button.textContent = "Scrape Leads";
  }
}

function showToast(message, type = "success", duration = 4500) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("success", "error");
  el.classList.add(type === "error" ? "error" : "success", "show");
  if (el._hideTimeout) clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.classList.remove("show");
  }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scrapeLeadsBtn");
  if (btn) btn.addEventListener("click", triggerScrape);
  loadLatestScrape();
  const refresh = document.getElementById("refreshScrapeHistory");
  if (refresh) refresh.addEventListener("click", () => loadScrapeHistory());
  loadScrapeHistory();
});