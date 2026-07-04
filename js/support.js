// support.js — MODULE 8D: Support Automation (post-booking reminders, docs, alerts)
// In the real system a scheduler (n8n/cron) would create these automatically.
// For this demo, the form lets you simulate that trigger manually.

async function loadBookingsDropdown() {
  const { data, error } = await supabaseClient.from("bookings").select("id, leads(name)");
  if (error) { console.error(error); return; }

  const select = document.getElementById("sa_booking");
  select.innerHTML = data.map((b) =>
    `<option value="${b.id}">Booking #${b.id} — ${b.leads ? b.leads.name : "Unknown"}</option>`
  ).join("");
}

async function loadSupportActions() {
  const { data, error } = await supabaseClient
    .from("support_actions")
    .select("*, bookings(leads(name))")
    .order("sent_at", { ascending: false });

  if (error) { console.error(error); return; }

  const tbody = document.getElementById("supportTableBody");
  tbody.innerHTML = data.map((a) => {
    const customerName = a.bookings && a.bookings.leads ? a.bookings.leads.name : "Unknown";
    return `
      <tr>
        <td>${customerName}</td>
        <td><span class="badge badge-${a.type}">${a.type}</span></td>
        <td>${a.message}</td>
        <td>${new Date(a.sent_at).toLocaleString()}</td>
      </tr>
    `;
  }).join("");
}

async function addSupportAction(e) {
  e.preventDefault();

  const action = {
    booking_id: document.getElementById("sa_booking").value,
    type: document.getElementById("sa_type").value,
    message: document.getElementById("sa_message").value
  };

  const { error } = await supabaseClient.from("support_actions").insert([action]);
  if (error) { alert("Could not add action."); console.error(error); return; }

  document.getElementById("supportForm").reset();
  loadSupportActions();
}

document.addEventListener("DOMContentLoaded", () => {
  loadBookingsDropdown();
  loadSupportActions();
  document.getElementById("supportForm").addEventListener("submit", addSupportAction);
});