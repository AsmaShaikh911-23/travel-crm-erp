// invoices.js — Invoice workflow read-only from Supabase

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

async function loadInvoices() {
  const { data, error } = await supabaseClient.from("invoices").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("invoicesTableBody");
  tbody.innerHTML = (data || []).map((invoice) => `
    <tr>
      <td>${invoice.invoice_number || "—"}</td>
      <td>${invoice.client_name || "—"}</td>
      <td>${invoice.package_name || "—"}</td>
      <td>${formatCurrency(invoice.amount)}</td>
      <td>${formatCurrency(invoice.gst || 0)}</td>
      <td><span class="badge ${invoice.payment_status === "Paid" ? "badge-paid" : "badge-pending"}">${invoice.payment_status || "Pending"}</span></td>
      <td>${formatDate(invoice.due_date)}</td>
      <td>${formatDate(invoice.generated_at || invoice.created_at)}</td>
      <td>
        ${invoice.pdf_url ? `<a href="${invoice.pdf_url}" target="_blank" rel="noopener">View PDF</a> · <a href="${invoice.pdf_url}" download>Download</a>` : "No PDF"}
      </td>
    </tr>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadInvoices);

function computeInvoicePreview() {
  const amount = parseFloat(document.getElementById('inv_amount')?.value || 0);
  const gstPct = parseFloat(document.getElementById('inv_gst_percent')?.value || 0);
  const otherPct = parseFloat(document.getElementById('inv_other_tax_percent')?.value || 0);
  const gst = (amount * gstPct) / 100;
  const other = (amount * otherPct) / 100;
  const total = amount + gst + other;
  const preview = document.getElementById('inv_preview');
  if (preview) preview.textContent = `GST: ${formatCurrency(gst)} · Total: ${formatCurrency(total)}`;
  return { amount, gst, other, total };
}

async function createManualInvoice(e) {
  e.preventDefault();
  const client = document.getElementById('inv_client_name').value.trim();
  const pkg = document.getElementById('inv_package_name').value.trim();
  if (!client || !pkg) { alert('Client and Package are required'); return; }

  const { amount, gst, other, total } = computeInvoicePreview();
  const dueDate = document.getElementById('inv_due_date')?.value || null;
  const invoiceNumber = `MAN-${Date.now()}`;

  const payload = {
    invoice_number: invoiceNumber,
    client_name: client,
    package_name: pkg,
    amount: amount,
    gst: gst,
    payment_status: 'Pending',
    due_date: dueDate,
    generated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient.from('invoices').insert([payload]);
  if (error) { console.error(error); alert('Could not create invoice.'); return; }

  document.getElementById('manualInvoiceForm').reset();
  computeInvoicePreview();
  loadInvoices();
  alert('Invoice created (manual).');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('manualInvoiceForm');
  if (form) form.addEventListener('submit', createManualInvoice);
  ['inv_amount','inv_gst_percent','inv_other_tax_percent'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', computeInvoicePreview);
  });
});
