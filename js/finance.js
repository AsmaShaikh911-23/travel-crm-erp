// finance.js — MODULE 8B: Finance Management
// Profit = Revenue - Cost, calculated live from the finance table.

async function loadFinance() {
  const { data, error } = await supabaseClient
    .from("finance")
    .select("*, leads(name)")
    .order("id", { ascending: true });

  if (error) { console.error(error); return; }

  let revenue = 0;
  let expense = 0;

  const tbody = document.getElementById("financeTableBody");
  tbody.innerHTML = data.map((f) => {
    if (f.type === "revenue") revenue += Number(f.amount);
    else expense += Number(f.amount);

    const amountClass = f.type === "revenue" ? "text-success" : "text-danger";
    return `
      <tr>
        <td>${f.description}</td>
        <td class="${amountClass}">₹${f.amount}</td>
        <td>${f.type}</td>
        <td>${f.leads ? f.leads.name : "-"}</td>
      </tr>
    `;
  }).join("");

  const profit = revenue - expense;
  document.getElementById("finRevenue").textContent = "₹" + revenue.toLocaleString();
  document.getElementById("finExpense").textContent = "₹" + expense.toLocaleString();
  document.getElementById("finProfit").textContent = "₹" + profit.toLocaleString();
}

async function loadLeadDropdown() {
  const { data, error } = await supabaseClient.from("leads").select("id, name");
  if (error) { console.error(error); return; }

  const select = document.getElementById("f_lead");
  select.innerHTML = '<option value="">No linked lead</option>' +
    data.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
}

async function addFinanceEntry(e) {
  e.preventDefault();

  const entry = {
    description: document.getElementById("f_description").value,
    amount: parseFloat(document.getElementById("f_amount").value),
    type: document.getElementById("f_type").value,
    lead_id: document.getElementById("f_lead").value || null
  };

  const { error } = await supabaseClient.from("finance").insert([entry]);
  if (error) { alert("Could not add entry."); console.error(error); return; }

  document.getElementById("financeForm").reset();
  loadFinance();
}

document.addEventListener("DOMContentLoaded", () => {
  loadFinance();
  loadLeadDropdown();
  document.getElementById("financeForm").addEventListener("submit", addFinanceEntry);
});