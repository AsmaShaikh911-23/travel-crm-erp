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