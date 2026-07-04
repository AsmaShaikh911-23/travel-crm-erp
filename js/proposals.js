// proposals.js — MODULE 5: Proposal history
// Uses a Supabase "embed" (leads(name)) which works because proposals.lead_id
// is a foreign key referencing leads.id.

async function loadProposals() {
  const { data, error } = await supabaseClient
    .from("proposals")
    .select("*, leads(name)")
    .order("id", { ascending: true });

  if (error) { console.error(error); return; }

  const tbody = document.getElementById("proposalsTableBody");
  tbody.innerHTML = data.map((p) => {
    const badgeClass = "badge-" + p.status.toLowerCase();
    return `
      <tr>
        <td>${p.leads ? p.leads.name : "Unknown"}</td>
        <td><a href="${p.pdf_link}" target="_blank">View PDF</a></td>
        <td><span class="badge ${badgeClass}">${p.status}</span></td>
        <td>${new Date(p.sent_at).toLocaleDateString()}</td>
      </tr>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadProposals);