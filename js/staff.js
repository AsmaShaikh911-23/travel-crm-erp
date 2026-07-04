// staff.js — MODULE 8C: Staff Management
// Performance = conversions / assigned_leads_count, shown as a percentage.

async function loadStaff() {
  const { data, error } = await supabaseClient.from("staff").select("*").order("id", { ascending: true });
  if (error) { console.error(error); return; }

  const tbody = document.getElementById("staffTableBody");
  tbody.innerHTML = data.map((s) => {
    const performance = s.assigned_leads_count
      ? ((s.conversions / s.assigned_leads_count) * 100).toFixed(1)
      : 0;

    return `
      <tr>
        <td>${s.name}</td>
        <td>${s.assigned_leads_count}</td>
        <td>${s.conversions}</td>
        <td>₹${s.commission}</td>
        <td>${performance}%</td>
      </tr>
    `;
  }).join("");
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
  if (error) { alert("Could not add staff member."); console.error(error); return; }

  document.getElementById("staffForm").reset();
  loadStaff();
}

document.addEventListener("DOMContentLoaded", () => {
  loadStaff();
  document.getElementById("staffForm").addEventListener("submit", addStaff);
});