// messages.js — MODULE 5: Chat history viewer

async function loadLeadsDropdown() {
  const { data, error } = await supabaseClient.from("leads").select("id, name");
  if (error) { console.error(error); return; }

  const select = document.getElementById("leadSelect");
  select.innerHTML = '<option value="">Select a lead</option>' +
    data.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
}

async function loadMessages(leadId) {
  const { data, error } = await supabaseClient
    .from("chat_history")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) { console.error(error); return; }

  const container = document.getElementById("chatContainer");
  container.innerHTML = data.map((msg) => `
    <div class="chat-bubble ${msg.sender === "customer" ? "bubble-customer" : "bubble-bot"}">
      <span class="bubble-platform">${msg.platform}</span>
      <p>${msg.message}</p>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeadsDropdown();
  document.getElementById("leadSelect").addEventListener("change", (e) => {
    if (e.target.value) loadMessages(e.target.value);
    else document.getElementById("chatContainer").innerHTML = "";
  });
});