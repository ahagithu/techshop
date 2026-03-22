/**
 * Contact page view
 */
import { navigate } from '../router.js';

export function render(container) {
  container.innerHTML = `
    <div class="contact-section">
      <h2 class="section-title">Contactez-nous</h2>
      <p class="section-subtitle">Disponibles 7j/7 — reponse en moins de 24h.</p>
      <div class="contact-cards">
        <div class="contact-card fade-in">
          <div class="contact-icon">💬</div>
          <h3>WhatsApp</h3>
          <p>Envoyez-nous un message directement sur WhatsApp pour commander ou poser une question.</p>
          <a href="https://wa.me/0600000000?text=Bonjour%2C+je+souhaite+avoir+des+informations." target="_blank" class="btn-contact whatsapp">WhatsApp</a>
        </div>
        <div class="contact-card fade-in" style="animation-delay:.1s">
          <div class="contact-icon">✉️</div>
          <h3>Email</h3>
          <p>Pour devis, commandes en gros ou toute demande professionnelle.</p>
          <a href="mailto:contact@techshop.com" class="btn-contact email">Envoyer un email</a>
        </div>
        <div class="contact-card fade-in" style="animation-delay:.2s">
          <div class="contact-icon">📍</div>
          <h3>Localisation</h3>
          <p>Casablanca, Maroc<br>Lun – Sam · 9h – 19h</p>
          <a href="https://maps.google.com" target="_blank" class="btn-contact" style="background:var(--bg);color:var(--text);border:1.5px solid var(--border)">Voir la carte</a>
        </div>
      </div>
    </div>
  `;
}
