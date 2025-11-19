import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://osywaesdozykwhupydzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeXdhZXNkb3p5a3dodXB5ZHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODE0OTYsImV4cCI6MjA3ODU1NzQ5Nn0.8Yb5tNAMsPkqoWPvsMsqSf6migp6BA5d9dbOdHyG-dE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add default bucket name used by the upload code (must match your storage bucket)
const DEFAULT_BUCKET = 'applicant-cvs';

const tbody = document.getElementById('applicants-tbody');
const searchInput = document.getElementById('search-input');

async function fetchApplicants() {
  try {
    const { data, error } = await supabase
      .from('recruitment_applicants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applicants:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching applicants:', err);
    return [];
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

async function getFileUrlFromStoragePath(cv_storage_path) {
  if (!cv_storage_path) return null;

  let bucket = DEFAULT_BUCKET;
  let path = cv_storage_path;

  const firstSlash = cv_storage_path.indexOf('/');
  if (firstSlash !== -1) {
    bucket = cv_storage_path.substring(0, firstSlash);
    path = cv_storage_path.substring(firstSlash + 1);
  } else {
    // when db stores only the path, attempt default bucket
    console.warn('cv_storage_path missing bucket, falling back to DEFAULT_BUCKET:', DEFAULT_BUCKET);
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error) {
      console.error('createSignedUrl error:', error);
      // If bucket not found or other error, return null so UI shows "Unavailable"
      return null;
    }
    if (data && data.signedUrl) return data.signedUrl;
  } catch (e) {
    console.error('Unexpected error creating signed url:', e);
  }
  return null;
}

function createRow(applicant) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${escapeHtml(applicant.name || '')}</td>
    <td>${escapeHtml(applicant.email || '')}</td>
    <td>${escapeHtml(applicant.phone || '')}</td>
    <td>${escapeHtml(applicant.address || '')}</td>
    <td>${formatDate(applicant.created_at)}</td>
    <td class="cv-cell">Loading...</td>
    <td>
      <button class="delete-btn" data-id="${applicant.id}" data-cv="${escapeAttr(applicant.cv_storage_path || '')}">
        Delete
      </button>
    </td>
  `;

  // attach delete handler
  const deleteBtn = tr.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', async (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    const cvPath = e.currentTarget.getAttribute('data-cv');
    if (!confirm('Delete this applicant? This will remove their record and CV file.')) return;
    await deleteApplicant(id, cvPath);
    await refresh();
  });

  // resolve CV link async and replace cell
  (async () => {
    const cvCell = tr.querySelector('.cv-cell');
    if (!applicant.cv_storage_path) {
      cvCell.textContent = '—';
      return;
    }
    const url = await getFileUrlFromStoragePath(applicant.cv_storage_path);
    if (url) {
      cvCell.innerHTML = `<a href="${url}" target="_blank" rel="noopener">View / Download</a>`;
    } else {
      cvCell.textContent = 'Unavailable';
    }
  })();

  return tr;
}

async function deleteApplicant(id, cv_storage_path) {
  try {
    const { error: delErr } = await supabase
      .from('recruitment_applicants')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('Failed to delete DB row:', delErr);
      alert('Failed to delete applicant record.');
      return;
    }

    if (cv_storage_path) {
      // support both "bucket/path" and "path-only" stored values
      let bucket = DEFAULT_BUCKET;
      let path = cv_storage_path;
      const firstSlash = cv_storage_path.indexOf('/');
      if (firstSlash !== -1) {
        bucket = cv_storage_path.substring(0, firstSlash);
        path = cv_storage_path.substring(firstSlash + 1);
      } else {
        console.warn('cv_storage_path missing bucket when deleting, using DEFAULT_BUCKET:', DEFAULT_BUCKET);
      }

      try {
        const { error: rmErr } = await supabase.storage.from(bucket).remove([path]);
        if (rmErr) {
          console.warn('Failed to remove file from storage:', rmErr);
        }
      } catch (e) {
        console.error('Unexpected error removing file from storage:', e);
      }
    }
    alert('Applicant query deleted successfully.');
  } catch (err) {
    console.error('Error deleting applicant:', err);
    alert('An error occurred while deleting the applicant.');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

async function refresh() {
  // Clear table before rendering to avoid duplicates
  tbody.innerHTML = '';
  const q = (searchInput && searchInput.value || '').trim().toLowerCase();
  const list = await fetchApplicants();
  const filtered = list.filter(a => {
    if (!q) return true;
    // Search in all fields, fallback to empty string if undefined
    return [a.name, a.email, a.phone, a.address]
      .map(v => (v || '').toLowerCase())
      .some(field => field.includes(q));
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7">No applicants found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  // Only render once per refresh
  for (const applicant of filtered) {
    tbody.appendChild(createRow(applicant));
  }
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    refresh();
  });
}

// initial load
refresh();
