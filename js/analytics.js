// analytics.js — MODULE 9: Analytics Dashboard
// This is the "aggregation engine": it pulls raw rows from leads + finance
// and computes every metric/chart in plain JS (no separate backend needed).
//
// Note: Campaign ROI / ROI trend from the original spec are left out here
// since they need a dedicated `campaigns` table with spend data - add that
// table later if there's time, following the same pattern as the other charts.

async function loadAnalytics() {
  const { data: leads, error: leadsError } = await supabaseClient.from("leads").select("*");
  const { data: finance, error: financeError } = await supabaseClient.from("finance").select("*");

  if (leadsError || financeError) {
    console.error(leadsError || financeError);
    return;
  }

  // ---- Sales metrics ----
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "Won").length;
  const conversionRate = totalLeads ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
  const pipelineValue = leads
    .filter((l) => !["Won", "Lost"].includes(l.status))
    .reduce((sum, l) => sum + Number(l.budget), 0);

  document.getElementById("aTotalLeads").textContent = totalLeads;
  document.getElementById("aConversion").textContent = conversionRate + "%";
  document.getElementById("aPipelineValue").textContent = "₹" + pipelineValue.toLocaleString();

  // ---- Finance metrics ----
  const revenue = finance.filter((f) => f.type === "revenue").reduce((sum, f) => sum + Number(f.amount), 0);
  const expense = finance.filter((f) => f.type === "expense").reduce((sum, f) => sum + Number(f.amount), 0);

  document.getElementById("aRevenue").textContent = "₹" + revenue.toLocaleString();
  document.getElementById("aProfit").textContent = "₹" + (revenue - expense).toLocaleString();

  // ---- Funnel chart: leads by pipeline stage ----
  const statuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
  const statusCounts = statuses.map((s) => leads.filter((l) => l.status === s).length);

  new Chart(document.getElementById("funnelChart"), {
    type: "bar",
    data: {
      labels: statuses,
      datasets: [{ label: "Leads", data: statusCounts, backgroundColor: "#4f6df5" }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  // ---- Source-wise leads chart ----
  const sources = [...new Set(leads.map((l) => l.source).filter(Boolean))];
  const sourceCounts = sources.map((s) => leads.filter((l) => l.source === s).length);

  new Chart(document.getElementById("sourceChart"), {
    type: "pie",
    data: {
      labels: sources,
      datasets: [{
        data: sourceCounts,
        backgroundColor: ["#4f6df5", "#16a34a", "#d97706", "#dc2626", "#7c3aed"]
      }]
    }
  });

  // ---- Destination popularity chart ----
  const destinations = [...new Set(leads.map((l) => l.destination).filter(Boolean))];
  const destinationCounts = destinations.map((d) => leads.filter((l) => l.destination === d).length);

  new Chart(document.getElementById("destinationChart"), {
    type: "bar",
    data: {
      labels: destinations,
      datasets: [{ label: "Leads", data: destinationCounts, backgroundColor: "#16a34a" }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  // ---- Revenue vs Expense chart ----
  new Chart(document.getElementById("revenueChart"), {
    type: "bar",
    data: {
      labels: ["Revenue", "Expense"],
      datasets: [{ data: [revenue, expense], backgroundColor: ["#16a34a", "#dc2626"] }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

document.addEventListener("DOMContentLoaded", loadAnalytics);