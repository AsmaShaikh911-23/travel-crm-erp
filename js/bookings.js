// bookings.js — MODULE 7: Booking Management
// Shows every booking with the linked lead name and vendor name,
// pulled via Supabase foreign key embeds (bookings.lead_id -> leads.id,
// bookings.vendor_id -> vendors.id).

async function loadBookings() {
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("*, leads(name), vendors(name)")
    .order("id", { ascending: true });

  if (error) { console.error(error); return; }

  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = data.map((b) => {
    const paymentClass = "badge-" + b.payment_status.toLowerCase();
    const bookingClass = "badge-" + b.booking_status.toLowerCase();
    return `
      <tr>
        <td>${b.leads ? b.leads.name : "Unknown"}</td>
        <td>${b.vendors ? b.vendors.name : "Unassigned"}</td>
        <td><span class="badge ${paymentClass}">${b.payment_status}</span></td>
        <td><span class="badge ${bookingClass}">${b.booking_status}</span></td>
        <td>${new Date(b.created_at).toLocaleDateString()}</td>
      </tr>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", loadBookings);