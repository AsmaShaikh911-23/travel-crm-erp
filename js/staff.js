// staff.js — Staff directory and lead reassignment

function formatLeadValue(value) {
  return value || "—";
}

let STAFF_DATA = [];
let ASSIGNED_BY_STAFF = new Map();

function renderLeadProfile(lead) {
  const panel = document.getElementById("leadProfilePanel");
  if (!panel || !lead) {
    return;
  }

  panel.innerHTML = `
    <h3>${lead.name || "Lead Profile"}</h3>
    <p><strong>Phone:</strong> ${formatLeadValue(lead.phone)}</p>
    <p><strong>Email:</strong> ${formatLeadValue(lead.email)}</p>
    <p><strong>Destination:</strong> ${formatLeadValue(lead.destination)}</p>
    <p><strong>Budget:</strong> ₹${Number(lead.budget || 0).toLocaleString()}</p>
    <p><strong>Source:</strong> ${formatLeadValue(lead.source)}</p>
    <p><strong>Status:</strong> ${formatLeadValue(lead.status)}</p>
    <p><strong>Lead Score:</strong> ${lead.lead_score || 0}</p>
  `;
}

async function loadStaff() {
  const [staffResult, staffLeadResult, leadsResult] = await Promise.all([
    supabaseClient.from("staff").select("*").order("id", { ascending: true }),
    supabaseClient.from("staff_leads").select("*, leads(*)"),
    supabaseClient.from("leads").select("*")
  ]);

  const { data: staffData, error: staffError } = staffResult;
  const { data: staffLeadData, error: staffLeadError } = staffLeadResult;
  const { data: leadsData, error: leadsError } = leadsResult;

  if (staffError || staffLeadError || leadsError) {
    console.error(staffError || staffLeadError || leadsError);
    return;
  }

  STAFF_DATA = staffData || [];
  const leadsById = Object.fromEntries((leadsData || []).map((lead) => [lead.id, lead]));
  ASSIGNED_BY_STAFF = new Map();

  (staffLeadData || []).forEach((record) => {
    const staffId = record.staff_id;
    const lead = record.leads || leadsById[record.lead_id];
    if (!lead) return;
    if (!ASSIGNED_BY_STAFF.has(staffId)) ASSIGNED_BY_STAFF.set(staffId, []);
    if (!ASSIGNED_BY_STAFF.get(staffId).some((item) => item.id === lead.id)) {
      ASSIGNED_BY_STAFF.get(staffId).push(lead);
    }
  });

  (leadsData || []).forEach((lead) => {
    if (!lead.assigned_staff_id) return;
    const staffId = Number(lead.assigned_staff_id);
    if (!ASSIGNED_BY_STAFF.has(staffId)) ASSIGNED_BY_STAFF.set(staffId, []);
    if (!ASSIGNED_BY_STAFF.get(staffId).some((item) => item.id === lead.id)) {
      ASSIGNED_BY_STAFF.get(staffId).push(lead);
    }
  });

  const container = document.getElementById("staffDirectory");
  if (container) {
    container.innerHTML = (staffData || []).map((staff) => {
      const assignedLeads = ASSIGNED_BY_STAFF.get(staff.id) || [];
      const activeLeads = assignedLeads.filter((lead) => !["Closed", "Won", "Lost"].includes(lead.status)).length;
      const closedLeads = assignedLeads.filter((lead) => ["Closed", "Won"].includes(lead.status)).length;
      const pendingFollowUps = assignedLeads.filter((lead) => ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation"].includes(lead.status)).length;
      const performance = staff.assigned_leads_count
        ? ((staff.conversions / staff.assigned_leads_count) * 100).toFixed(1)
        : 0;

      return `
        <article class="staff-card">
          <div class="staff-card-header">
            <h3>${staff.name}</h3>
            <span class="badge badge-viewed">Performance ${performance}%</span>
          </div>
          <div class="staff-metrics">
            <div><strong>${assignedLeads.length}</strong><span>Total Assigned</span></div>
            <div><strong>${activeLeads}</strong><span>Active</span></div>
            <div><strong>${closedLeads}</strong><span>Closed</span></div>
            <div><strong>${pendingFollowUps}</strong><span>Pending Follow-ups</span></div>
            <div><strong>${staff.conversions}</strong><span>Conversion Count</span></div>
            <div><strong>₹${Number(staff.commission || 0).toLocaleString()}</strong><span>Commission</span></div>
          </div>
          <div class="staff-lead-list">
            ${assignedLeads.length
              ? assignedLeads.map((lead) => `<button class="lead-pill" data-lead='${JSON.stringify(lead)}'>${lead.name}</button>`).join("")
              : "No assigned leads"}
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll(".lead-pill").forEach((button) => {
      button.addEventListener("click", () => {
        const lead = JSON.parse(button.getAttribute("data-lead"));
        renderLeadProfile(lead);
      });
    });
  }

  const staffSelect = document.getElementById("reassignStaff");
  const leadSelect = document.getElementById("reassignLead");
  if (staffSelect) {
    staffSelect.innerHTML = (staffData || []).map((staff) => `<option value="${staff.id}">${staff.name}</option>`).join("");
  }
  if (leadSelect) {
    leadSelect.innerHTML = (leadsData || []).map((lead) => `<option value="${lead.id}">${lead.name}</option>`).join("");
  }

  // populate staff picker for detailed view
  const staffPicker = document.getElementById("staffPicker");
  if (staffPicker) {
    staffPicker.innerHTML = (staffData || []).map((s) => `<option value="${s.id}">${s.name} (${(ASSIGNED_BY_STAFF.get(s.id)||[]).length})</option>`).join("");
    staffPicker.addEventListener('change', () => showSelectedStaff(Number(staffPicker.value)));
  }

  if ((staffData || []).length) {
    // default to first staff
    const defaultId = (staffData || [])[0].id;
    if (staffPicker) staffPicker.value = defaultId;
    showSelectedStaff(defaultId);
  }
}

function showSelectedStaff(staffId) {
  const staff = STAFF_DATA.find((s) => s.id === Number(staffId));
  const panel = document.getElementById("staffDetailPanel");
  if (!panel || !staff) return;

  const assignedLeads = ASSIGNED_BY_STAFF.get(staff.id) || [];
  const activeLeads = assignedLeads.filter((lead) => !["Closed", "Won", "Lost"].includes(lead.status)).length;
  const closedLeads = assignedLeads.filter((lead) => ["Closed", "Won"].includes(lead.status)).length;
  const pendingFollowUps = assignedLeads.filter((lead) => ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation"].includes(lead.status)).length;

  panel.innerHTML = `
    <h3>${staff.name}</h3>
    <div class="staff-metrics" style="margin-top:8px;">
      <div><strong>${assignedLeads.length}</strong><span>Total Assigned</span></div>
      <div><strong>${activeLeads}</strong><span>Active</span></div>
      <div><strong>${closedLeads}</strong><span>Closed</span></div>
      <div><strong>${pendingFollowUps}</strong><span>Pending Follow-ups</span></div>
      <div><strong>${staff.conversions}</strong><span>Conversion Count</span></div>
      <div><strong>₹${Number(staff.commission || 0).toLocaleString()}</strong><span>Commission</span></div>
    </div>
    <h4 style="margin-top:12px;">Assigned Leads</h4>
    <table class="data-table">
      <thead><tr><th>Name</th><th>Phone</th><th>Destination</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        ${assignedLeads.length ? assignedLeads.map((lead) => `
          <tr>
            <td>${lead.name}</td>
            <td>${lead.phone || '—'}</td>
            <td>${lead.destination || '—'}</td>
            <td><span class="badge badge-${(lead.status||'').toLowerCase().replace(/\s+/g,'')}">${lead.status||'—'}</span></td>
            <td><button class="secondary-btn view-lead" data-lead='${JSON.stringify(lead)}'>View</button></td>
          </tr>
        `).join('') : '<tr><td colspan="5" class="muted">No assigned leads</td></tr>'}
      </tbody>
    </table>
  `;

  panel.querySelectorAll('.view-lead').forEach((btn) => btn.addEventListener('click', (e) => {
    const lead = JSON.parse(btn.getAttribute('data-lead'));
    renderLeadProfile(lead);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
}

async function addStaff(e) {
  e.preventDefault();

  const newStaff = {
    name: document.getElementById("s_name").value,
    assigned_leads_count: parseInt(document.getElementById("s_assigned").value) || 0,
    conversions: parseInt(document.getElementById("s_conversions").value) || 0,
    commission: parseFloat(document.getElementById("s_commission").value) || 0
  };

  const { error } = await supabaseClient.from("staff").insert([newStaff]);
  if (error) {
    alert("Could not add staff member.");
    console.error(error);
    return;
  }

  document.getElementById("staffForm").reset();
  loadStaff();
}

async function reassignLead(e) {
  e.preventDefault();

  const staffId = document.getElementById("reassignStaff").value;
  const leadId = document.getElementById("reassignLead").value;

  if (!staffId || !leadId) {
    alert("Select both a staff member and a lead.");
    return;
  }

  const { data: existingLink, error: lookupError } = await supabaseClient
    .from("staff_leads")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (lookupError) {
    console.error(lookupError);
    return;
  }

  if (existingLink) {
    const { error } = await supabaseClient.from("staff_leads").update({ staff_id: staffId }).eq("lead_id", leadId);
    if (error) {
      console.error(error);
      alert("Could not reassign the lead.");
      return;
    }
  } else {
    const { error } = await supabaseClient.from("staff_leads").insert([{ staff_id: staffId, lead_id: leadId }]);
    if (error) {
      console.error(error);
      alert("Could not reassign the lead.");
      return;
    }
  }

  const { error: leadError } = await supabaseClient.from("leads").update({ assigned_staff_id: staffId }).eq("id", leadId);
  if (leadError) {
    console.error(leadError);
    alert("Could not update the lead assignment.");
    return;
  }

  document.getElementById("reassignForm").reset();
  loadStaff();
}

document.addEventListener("DOMContentLoaded", () => {
  loadStaff();
  const staffForm = document.getElementById("staffForm");
  if (staffForm) staffForm.addEventListener("submit", addStaff);
  const reassignForm = document.getElementById("reassignForm");
  if (reassignForm) reassignForm.addEventListener("submit", reassignLead);
});