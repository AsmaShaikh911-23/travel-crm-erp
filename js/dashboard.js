// dashboard.js — MODULE 5: Dashboard KPIs

async function loadDashboard() {
  const { data: leads, error: leadsError } = await supabaseClient.from("leads").select("*");
  const { data: finance, error: financeError } = await supabaseClient.from("finance").select("*");

  if (leadsError || financeError) {
    console.error(leadsError || financeError);
    return;
  }

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
  const wonLeads = leads.filter((l) => l.status === "Won").length;
  const conversionRate = totalLeads ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  const revenue = finance
    .filter((f) => f.type === "revenue")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const expense = finance
    .filter((f) => f.type === "expense")
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const profit = revenue - expense;

  document.getElementById("kpiTotalLeads").textContent = totalLeads;
  document.getElementById("kpiHotLeads").textContent = hotLeads;
  document.getElementById("kpiConversion").textContent = conversionRate + "%";
  document.getElementById("kpiRevenue").textContent = "₹" + revenue.toLocaleString();
  document.getElementById("kpiProfit").textContent = "₹" + profit.toLocaleString();
}

document.addEventListener("DOMContentLoaded", loadDashboard);