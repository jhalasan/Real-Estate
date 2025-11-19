import { supabase } from './supabaseClient.js';

const tableBody = document.getElementById('contactTableBody');
const searchInput = document.getElementById('searchInput');

let contacts = [];

async function fetchContacts() {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .select('id, name, email, phone, message, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    contacts = data || [];
    renderContacts(contacts);
  } catch (err) {
    console.error('Unexpected error fetching contacts:', err);
  }
}

function renderContacts(list) {
  tableBody.innerHTML = '';
  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;opacity:0.7">No contacts found.</td></tr>`;
    return;
  }

  const rows = list.map(c => {
    const date = c.created_at ? new Date(c.created_at).toLocaleString() : '-';
    // escape inner text minimally to avoid basic HTML injection
    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `
      <tr data-id="${esc(c.id)}">
        <td>${esc(c.name)}</td>
        <td>${esc(c.email)}</td>
        <td>${esc(c.phone)}</td>
        <td>${esc(date)}</td>
        <td style="max-width:320px;white-space:pre-wrap;">${esc(c.message)}</td>
        <td><button class="delete-btn" data-id="${esc(c.id)}">Delete</button></td>
      </tr>
    `;
  }).join('');
  tableBody.innerHTML = rows;
}

async function deleteContact(id) {
  if (!confirm('Delete this contact?')) return;
  try {
    const { error } = await supabase
      .from('contact_info')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }

    // remove from cache and re-render
    contacts = contacts.filter(c => String(c.id) !== String(id));
    applyFilter(); // re-render filtered view
  } catch (err) {
    console.error('Error deleting contact:', err);
  }
}

function applyFilter() {
  const q = (searchInput.value || '').trim().toLowerCase();
  if (!q) {
    renderContacts(contacts);
    return;
  }
  const filtered = contacts.filter(c => {
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
  });
  renderContacts(filtered);
}

// delegated listener for delete buttons
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  deleteContact(id);
});

// search input handling with small debounce
let debounceTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => applyFilter(), 200);
});

// initial fetch
fetchContacts();
