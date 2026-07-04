// vendors.js — MODULE 8A: Vendor Management

async function loadVendors() {
  const { data, error } = await supabaseClient.from("vendors").select("*").order("id", { ascending: true });
  if (error) { console.error(error); return; }

  const tbody = document.getElementById("vendorsTableBody");
  tbody.innerHTML = data.map((v) => `
    <tr>
      <td>${v.name}</td>
      <td>${v.type}</td>
      <td>${v.contact}</td>
      <td>₹${v.cost}</td>
    </tr>
  `).join("");
}

async function addVendor(e) {
  e.preventDefault();

  const newVendor = {
    name: document.getElementById("v_name").value,
    type: document.getElementById("v_type").value,
    contact: document.getElementById("v_contact").value,
    cost: parseFloat(document.getElementById("v_cost").value)
  };

  const { error } = await supabaseClient.from("vendors").insert([newVendor]);
  if (error) { alert("Could not add vendor."); console.error(error); return; }

  document.getElementById("vendorForm").reset();
  loadVendors();
}

document.addEventListener("DOMContentLoaded", () => {
  loadVendors();
  document.getElementById("vendorForm").addEventListener("submit", addVendor);
});