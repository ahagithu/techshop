/**
 * Login page view
 */
import { login, register, resetPassword, showToast } from '../firebase.js';
import { navigate } from '../router.js';

let _tab = 'login';

export function render(container) {
  container.innerHTML = `
    <div style="min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:40px 24px">
      <div style="background:var(--surface);border-radius:var(--radius-lg);padding:40px;width:100%;max-width:420px;box-shadow:var(--shadow-lg)">
        <div style="font-size:2rem;font-weight:800;text-align:center;margin-bottom:4px">
          Tech<span style="color:var(--primary)">Shop</span>
        </div>
        <div style="text-align:center;color:var(--text-secondary);font-size:.9rem;margin-bottom:28px">Acces administrateur</div>

        <div class="login-tabs">
          <div class="login-tab ${_tab==='login'?'active':''}" onclick="window.__switchTab('login')">Connexion</div>
          <div class="login-tab ${_tab==='register'?'active':''}" onclick="window.__switchTab('register')">Creer un compte</div>
        </div>

        <div id="loginError" style="background:#ffe5e5;color:#b00020;padding:12px 14px;border-radius:var(--radius-sm);font-size:.875rem;margin-bottom:16px;display:none"></div>

        <div class="login-form-group">
          <label>Email</label>
          <input type="email" id="loginEmail" placeholder="admin@example.com" autocomplete="email" onkeydown="if(event.key==='Enter')window.__submit()" />
        </div>
        <div class="login-form-group">
          <label>Mot de passe</label>
          <input type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')window.__submit()" />
        </div>
        <div class="login-form-group" id="confirmGroup" style="display:none">
          <label>Confirmer le mot de passe</label>
          <input type="password" id="loginConfirm" placeholder="••••••••" autocomplete="new-password" onkeydown="if(event.key==='Enter')window.__submit()" />
        </div>

        <button class="btn-login" id="loginBtn" onclick="window.__submit()">Se connecter</button>

        <div style="text-align:center;margin-top:12px">
          <a onclick="window.__openReset()" style="color:var(--primary);font-size:.82rem;cursor:pointer;text-decoration:none">Mot de passe oublie ?</a>
        </div>

        <div id="resetPanel" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-size:.82rem;color:var(--text-secondary);margin-bottom:10px">Entrez votre email pour recevoir un lien de reinitialisation.</div>
          <input type="email" id="resetEmail" placeholder="votre@email.com" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.9rem;margin-bottom:8px;outline:none" />
          <button onclick="window.__sendReset()" style="width:100%;padding:10px;background:var(--primary);color:white;border:none;border-radius:var(--radius-sm);font-weight:600;cursor:pointer">Envoyer le lien</button>
          <div id="resetSuccess" style="color:var(--success);font-size:.82rem;margin-top:8px;display:none">✅ Email envoye ! Verifiez votre boite.</div>
        </div>
      </div>
    </div>
  `;

  window.__submit = handleSubmit;
  window.__switchTab = switchTab;
  window.__openReset = openReset;
  window.__sendReset = sendReset;
}

function switchTab(tab) {
  _tab = tab;
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  document.getElementById('confirmGroup').style.display = tab==='register' ? '' : 'none';
  document.getElementById('resetPanel').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginBtn').textContent = tab==='login' ? 'Se connecter' : 'Creer un compte';
}

function openReset() {
  const panel = document.getElementById('resetPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function sendReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) { showToast('Entrez votre email.', 'error'); return; }
  try {
    await resetPassword(email);
    document.getElementById('resetSuccess').style.display = 'block';
  } catch (err) {
    showToast(err.code === 'auth/user-not-found' ? 'Compte introuvable.' : err.message, 'error');
  }
}

async function handleSubmit() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const confirm  = document.getElementById('loginConfirm').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  errEl.style.display = 'none';

  if (!email || !password) { errEl.textContent='Remplissez tous les champs.'; errEl.style.display='block'; return; }

  if (_tab === 'register') {
    if (password !== confirm) { errEl.textContent='Les mots de passe ne correspondent pas.'; errEl.style.display='block'; return; }
    if (password.length < 6) { errEl.textContent='Minimum 6 caracteres.'; errEl.style.display='block'; return; }
  }

  btn.disabled = true; btn.textContent = _tab==='login' ? 'Connexion…' : 'Creation…';

  try {
    if (_tab === 'login') {
      await login(email, password);
      showToast(`Bienvenue !`, 'success');
      navigate('/admin');
    } else {
      await register(email, password);
      showToast('Compte cree ! Bienvenue.', 'success');
      navigate('/admin');
    }
  } catch (err) {
    const msgs = {
      'auth/user-not-found'    : 'Compte introuvable.',
      'auth/wrong-password'    : 'Mot de passe incorrect.',
      'auth/invalid-email'     : 'Email invalide.',
      'auth/email-already-in-use': 'Cet email est deja utilise.',
      'auth/weak-password'    : 'Mot de passe trop faible.',
      'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    };
    errEl.textContent = msgs[err.code] || 'Erreur de connexion.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = _tab==='login' ? 'Se connecter' : 'Creer un compte';
  }
}
