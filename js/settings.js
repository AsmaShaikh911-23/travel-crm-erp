// settings.js — Manage app settings directly in Supabase

async function loadSettings() {
  const { data, error } = await supabaseClient.from("app_settings").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }

  const settings = Object.fromEntries((data || []).map((entry) => [entry.setting_key, entry.setting_value]));
  document.getElementById("company_name").value = settings.company_name || "";
  document.getElementById("n8n_webhook_url").value = settings.n8n_webhook_url || "";
  document.getElementById("email_provider").value = settings.email_provider || "";
  document.getElementById("whatsapp_api").value = settings.whatsapp_api || "";
  document.getElementById("instagram_token").value = settings.instagram_token || "";
  document.getElementById("facebook_token").value = settings.facebook_token || "";
  document.getElementById("theme").value = settings.theme || "light";
}

async function saveSettings(e) {
  e.preventDefault();

  const entries = [
    { setting_key: "company_name", setting_value: document.getElementById("company_name").value },
    { setting_key: "n8n_webhook_url", setting_value: document.getElementById("n8n_webhook_url").value },
    { setting_key: "email_provider", setting_value: document.getElementById("email_provider").value },
    { setting_key: "whatsapp_api", setting_value: document.getElementById("whatsapp_api").value },
    { setting_key: "instagram_token", setting_value: document.getElementById("instagram_token").value },
    { setting_key: "facebook_token", setting_value: document.getElementById("facebook_token").value },
    { setting_key: "theme", setting_value: document.getElementById("theme").value }
  ];

  for (const entry of entries) {
    const { error } = await supabaseClient
      .from("app_settings")
      .upsert({ setting_key: entry.setting_key, setting_value: entry.setting_value }, { onConflict: "setting_key" });

    if (error) {
      console.error(error);
      alert("Could not save settings.");
      return;
    }
  }

  alert("Settings saved.");
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);
});
