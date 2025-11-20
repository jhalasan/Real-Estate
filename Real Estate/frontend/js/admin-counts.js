import { supabase } from './supabaseClient.js';

const tables = [
  { table: 'contact_info', outId: 'total-contact-count' },
  { table: 'recruitment_applicants', outId: 'total-career-count' },
  { table: 'inquiries', outId: 'total-inquiries-count' }
];

async function updateAdminCounts() {
  await Promise.all(tables.map(async t => {
    const el = document.getElementById(t.outId);
    if (el) el.textContent = '...'; // show loading

    try {
      const { count, error } = await supabase
        .from(t.table)
        .select('*', { count: 'exact', head: true }); // head: true avoids fetching rows

      if (error) throw error;
      if (el) el.textContent = String(count ?? 0);
    } catch (err) {
      console.error(`Error counting ${t.table}:`, err);
      if (el) el.textContent = '0';
    }
  }));
}

// Call this once when page loads, and optionally whenever data is updated
document.addEventListener('DOMContentLoaded', () => {
  updateAdminCounts();
});
