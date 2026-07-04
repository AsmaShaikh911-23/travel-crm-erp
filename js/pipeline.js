// pipeline.js — MODULE 5: Pipeline (Kanban-style status view)
// Automation logic: changing a lead's status here is what drives the
// "proposal generated -> status update" and "payment received -> booking created" rules.
// (Booking creation itself happens on the Vendors page once a lead is Won.)

const STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];

async function loadPipeline() {
  const { data, error } = await supabaseClient.from("leads").select("*");
  if (error) { console.error(error); return; }

  const board = document.getElementById("pipelineBoard");

  board.innerHTML = STATUSES.map((status) => {
    const leadsInStatus = data.filter((l) => l.status === status);

    const cards = leadsInStatus.map((lead) => `
      <div class="kanban-card">
        <p class="card-name">${lead.name}</p>
        <p class="card-sub">${lead.destination} — ₹${lead.budget}</p>
        <select class="status-select" data-lead-id="${lead.id}">
          ${STATUSES.map((s) => `<option value="${s}" ${s === lead.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
    `).join("");

    return `
      <div class="kanban-column">
        <h3 class="kanban-title">${status} <span class="kanban-count">${leadsInStatus.length}</span></h3>
        <div class="kanban-cards">${cards}</div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", handleStatusChange);
  });
}

async function handleStatusChange(e) {
  const leadId = e.target.dataset.leadId;
  const newStatus = e.target.value;

  const { error } = await supabaseClient.from("leads").update({ status: newStatus }).eq("id", leadId);
  if (error) { alert("Could not update status."); console.error(error); return; }

  loadPipeline();
}

document.addEventListener("DOMContentLoaded", loadPipeline);