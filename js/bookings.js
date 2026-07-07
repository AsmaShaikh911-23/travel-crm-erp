// bookings.js — Booking management with multi-vendor support

async function loadBookings() {
  const [bookingsResult, bookingVendorResult, vendorsResult] = await Promise.all([
    supabaseClient.from("bookings").select("*, leads(name)").order("id", { ascending: true }),
    supabaseClient.from("booking_vendors").select("*, vendors(name)").order("id", { ascending: true }),
    supabaseClient.from("vendors").select("*").order("id", { ascending: true })
  ]);

  const { data: bookings, error: bookingsError } = bookingsResult;
  const { data: bookingVendors, error: bookingVendorsError } = bookingVendorResult;
  const { data: vendors, error: vendorsError } = vendorsResult;

  if (bookingsError || bookingVendorsError || vendorsError) {
    console.error(bookingsError || bookingVendorsError || vendorsError);
    return;
  }

  const vendorMap = Object.fromEntries((vendors || []).map((vendor) => [vendor.id, vendor]));
  const vendorsByBooking = new Map();

  (bookingVendors || []).forEach((record) => {
    if (!record.vendor_id) return;
    if (!vendorsByBooking.has(record.booking_id)) vendorsByBooking.set(record.booking_id, []);
    const vendorName = record.vendors?.name || vendorMap[record.vendor_id]?.name || "Vendor";
    if (!vendorsByBooking.get(record.booking_id).includes(vendorName)) {
      vendorsByBooking.get(record.booking_id).push(vendorName);
    }
  });

  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = (bookings || []).map((b) => {
    const paymentClass = "badge-" + (b.payment_status || "pending").toLowerCase();
    const bookingClass = "badge-" + (b.booking_status || "confirmed").toLowerCase();
    const assignedVendors = (vendorsByBooking.get(b.id) || []).join(", ") || "Unassigned";
    return `
      <tr>
        <td>${b.leads ? b.leads.name : "Unknown"}</td>
        <td>${assignedVendors}</td>
        <td><span class="badge ${paymentClass}">${b.payment_status || "Pending"}</span></td>
        <td><span class="badge ${bookingClass}">${b.booking_status || "Confirmed"}</span></td>
        <td>${new Date(b.created_at).toLocaleDateString()}</td>
      </tr>
    `;
  }).join("");

  const bookingSelect = document.getElementById("bookingSelect");
  const vendorSelect = document.getElementById("vendorSelect");
  if (bookingSelect) {
    bookingSelect.innerHTML = (bookings || []).map((booking) => `<option value="${booking.id}">${booking.leads ? booking.leads.name : "Booking " + booking.id}</option>`).join("");
  }
  if (vendorSelect) {
    vendorSelect.innerHTML = (vendors || []).map((vendor) => `<option value="${vendor.id}">${vendor.name} (${vendor.type})</option>`).join("");
  }
}

async function assignVendor(e) {
  e.preventDefault();
  const bookingId = document.getElementById("bookingSelect").value;
  const vendorId = document.getElementById("vendorSelect").value;

  if (!bookingId || !vendorId) {
    alert("Choose a booking and a vendor.");
    return;
  }

  const { error } = await supabaseClient.from("booking_vendors").insert([{ booking_id: bookingId, vendor_id: vendorId }]);
  if (error) {
    console.error(error);
    alert("Could not assign the vendor.");
    return;
  }

  document.getElementById("bookingVendorForm").reset();
  loadBookings();
}

document.addEventListener("DOMContentLoaded", () => {
  loadBookings();
  const form = document.getElementById("bookingVendorForm");
  if (form) form.addEventListener("submit", assignVendor);
});