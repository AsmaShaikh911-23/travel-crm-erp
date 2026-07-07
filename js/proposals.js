// proposals.js — Proposal tracking backed by Supabase

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function badgeClass(status) {
  const normalized = (status || "sent").toLowerCase().replace(/\s+/g, "");
  return "badge-" + normalized;
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

async function loadProposals() {
  const { data, error } = await supabaseClient
    .from("proposals")
    .select("*, leads(name)")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("proposalsTableBody");
  tbody.innerHTML = data.map((p) => {
    const leadName = p.leads ? p.leads.name : "Unknown";
    const viewedText = p.viewed_at ? formatDateTime(p.viewed_at) : "Proposal Not Viewed";
    return `
      <tr>
        <td>${leadName}</td>
        <td><a href="${p.pdf_link || "#"}" target="_blank" rel="noopener">View PDF</a></td>
        <td><span class="badge ${badgeClass(p.status)}">${p.status || "Sent"}</span></td>
        <td>${formatDateTime(p.sent_at)}</td>
        <td>${viewedText}</td>
        <td>${p.resend_count || 0}</td>
        <td><button class="secondary-btn resend-btn" data-id="${p.id}">Resend Proposal</button></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".resend-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const proposalId = button.getAttribute("data-id");
      await resendProposal(proposalId);
    });
  });
}

async function resendProposal(proposalId) {
  const webhookUrl = await getSettingValue("n8n_webhook_url");
  if (!webhookUrl) {
    alert("Configure the n8n webhook URL in Settings first.");
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend_proposal", proposal_id: proposalId, triggered_from: "erp_proposals" })
    });
  } catch (error) {
    console.error(error);
    alert("Could not resend the proposal.");
    return;
  }

  setTimeout(loadProposals, 3500);
}

document.addEventListener("DOMContentLoaded", loadProposals);