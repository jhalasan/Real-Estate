import { supabase } from './supabaseClient.js';

let tbody;
let searchInput;

// small sanitizer for display
const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// READ: load all inquiries
async function loadInquiries() {
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="padding:12px;text-align:center;color:#666">Loading...</td></tr>`;
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:12px;color:#b00">Error loading inquiries</td></tr>`;
    console.error(error);
    return;
  }

  renderRows(data || []);
}

// render rows and store cache for client search
function renderRows(rows) {
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:12px;text-align:center;color:#666">No inquiries found.</td></tr>`;
    tbody.dataset._rows = JSON.stringify([]);
    return;
  }

  const frag = document.createDocumentFragment();
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.id = r.id;
    const date = r.created_at ? new Date(r.created_at).toLocaleString() : '';
    tr.innerHTML = `
      <td>${escapeHtml(r.name)}</td>
      <td><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></td>
      <td>${escapeHtml(r.phone || '')}</td>
      <td>${escapeHtml(date)}</td>
      <td class="message-cell" style="max-width:420px;white-space:pre-wrap;word-break:break-word;">${escapeHtml(r.message)}</td>
      <td class="actions-cell">
        <button class="edit-btn" data-id="${r.id}" title="Edit">Edit</button>
        <button class="delete-btn" data-id="${r.id}" title="Delete" style="margin-left:8px;color:#b00;">Delete</button>
      </td>
    `;
    frag.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(frag);
  tbody.dataset._rows = JSON.stringify(rows);
}

// DELETE: remove inquiry
async function deleteInquiry(id, rowElement) {
  if (!confirm('Delete this inquiry? This cannot be undone.')) return;
  try {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // update UI
    if (rowElement) rowElement.remove();
    // update cache
    const raw = tbody.dataset._rows ? JSON.parse(tbody.dataset._rows) : [];
    const updated = raw.filter(r => String(r.id) !== String(id));
    tbody.dataset._rows = JSON.stringify(updated);
    if (updated.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:12px;text-align:center;color:#666">No inquiries found.</td></tr>`;
    }
  } catch (err) {
    console.error('Delete failed', err);
    alert('Failed to delete inquiry.');
  }
}

// UPDATE: edit message (simple prompt)
async function editInquiryMessage(id, rowElement) {
  const msgCell = rowElement.querySelector('.message-cell');
  if (!msgCell) return;
  const current = msgCell.textContent.trim();
  const updated = prompt('Edit message:', current);
  if (updated === null) return; // cancelled
  const newMsg = updated.trim();
  if (newMsg === current) return;

  try {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ message: newMsg })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // update UI and cache
    msgCell.textContent = data.message;
    const raw = tbody.dataset._rows ? JSON.parse(tbody.dataset._rows) : [];
    const idx = raw.findIndex(r => String(r.id) === String(id));
    if (idx !== -1) {
      raw[idx].message = data.message;
      tbody.dataset._rows = JSON.stringify(raw);
    }
  } catch (err) {
    console.error('Update failed', err);
    alert('Failed to update inquiry.');
  }
}

// client-side search/filter
function applyFilter(query) {
  const raw = tbody.dataset._rows ? JSON.parse(tbody.dataset._rows) : [];
  const q = (query || '').trim();
  if (!q) {
    renderRows(raw);
    return;
  }

  const lower = q.toLowerCase();

  // parse field-specific tokens like: name:John or email:"foo@bar.com"
  const fieldPattern = /(?:^|\s)(name|email|phone|message):(?:"([^"]+)"|(\S+))/gi;
  const criteria = [];
  let m;
  let leftover = lower;
  while ((m = fieldPattern.exec(lower)) !== null) {
    const field = m[1];
    const value = (m[2] || m[3] || '').trim();
    if (value) {
      criteria.push({ field, value: value.toLowerCase() });
      leftover = leftover.replace(m[0].toLowerCase(), ' ');
    }
  }
  leftover = leftover.trim();

  const filtered = raw.filter(r => {
    // all field-specific criteria must match (AND)
    for (const c of criteria) {
      if (!((r[c.field] || '').toLowerCase().includes(c.value))) return false;
    }
    if (!leftover) return true;

    // leftover general term matches any field (OR)
    const term = leftover;
    return (r.name || '').toLowerCase().includes(term)
      || (r.email || '').toLowerCase().includes(term)
      || (r.phone || '').toLowerCase().includes(term)
      || (r.message || '').toLowerCase().includes(term);
  });

  renderRows(filtered);
}

// event delegation for edit/delete
function attachDelegation() {
  tbody.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    const editBtn = e.target.closest('.edit-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const row = deleteBtn.closest('tr');
      deleteInquiry(id, row);
      return;
    }
    if (editBtn) {
      const id = editBtn.dataset.id;
      const row = editBtn.closest('tr');
      editInquiryMessage(id, row);
      return;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  tbody = document.getElementById('inquiriesTableBody');
  searchInput = document.getElementById('searchInput');

  if (!tbody) {
    console.error('inquiriesTableBody not found');
    return;
  }

  attachDelegation();
  loadInquiries();

  if (searchInput) {
    // hint for dynamic search syntax
    searchInput.placeholder = 'Search (use prefixes: name:, email:, phone:, message:)';

    let t;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => applyFilter(e.target.value), 150);
    });
  }
});