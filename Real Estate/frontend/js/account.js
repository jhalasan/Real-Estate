import { supabase } from './supabaseClient.js';

async function renderAccountArea(session) {
  const accountArea = document.getElementById('accountArea');
  if (!accountArea) return;

  if (!session || !session.user) {
    accountArea.innerHTML = `<a class="account-btn" href="login.html">Login / Create Account</a>`;
    return;
  }

  const authId = session.user.id;

  // try to read full name; fallback to email or "User"
  const { data: account } = await supabase
    .from('accounts')
    .select('name')
    .eq('auth_id', authId)
    .single();

  const fullname = account?.name || session.user.email || 'User';

  accountArea.innerHTML = `
    <div class="profile-container" id="profileMenu" style="position:relative; cursor:pointer;">
      <span class="profile-icon">👤</span>
      <span class="profile-name" id="profileName">${fullname}</span>
      <div class="profile-dropdown" id="profileDropdown" style="
        display:none;
        position:absolute;
        top:100%;
        right:0;
        background:#fff;
        border:1px solid #ccc;
        border-radius:8px;
        min-width:200px;
        box-shadow:0 2px 10px rgba(0,0,0,0.1);
        z-index:1000;
      ">
        <p style="padding:10px; font-weight:600; margin:0;">${fullname}</p>
        <a href="profile.html" style="display:block; padding:10px; text-decoration:none; color:#333;">Profile</a>
        <a href="#" id="signoutBtn" style="display:block; padding:10px; text-decoration:none; color:#333;">Sign Out</a>
      </div>
    </div>
  `;

  const profileMenu = document.getElementById('profileMenu');
  const dropdown = document.getElementById('profileDropdown');
  if (profileMenu && dropdown) {
    profileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  }

  const signoutBtn = document.getElementById('signoutBtn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      renderAccountArea(null);
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // initial render from current session
  const { data: { session } } = await supabase.auth.getSession();
  await renderAccountArea(session);

  // listen to auth events
  supabase.auth.onAuthStateChange((event, session) => {
    renderAccountArea(session);
  });
});
