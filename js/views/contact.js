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
          <p>Envoyez-nous un message directement sur WhatsApp.</p>
          <div class="contact-links">
            <a href="https://wa.me/22789631595?text=Bonjour%2C+je+souhaite+avoir+des+informations." target="_blank" class="btn-contact whatsapp">
              <span>+227 89 63 15 95</span>
            </a>
            <a href="https://wa.me/22793033158?text=Bonjour%2C+je+souhaite+avoir+des+informations." target="_blank" class="btn-contact whatsapp">
              <span>+227 93 03 31 58</span>
            </a>
          </div>
        </div>
        <div class="contact-card fade-in" style="animation-delay:.1s">
          <div class="contact-icon">✉️</div>
          <h3>Email</h3>
          <p>Pour devis, commandes en gros ou toute demande professionnelle.</p>
          <div class="contact-links">
            <a href="mailto:www.adamoualhou25@gmail.com" class="btn-contact email">
              <span>www.adamoualhou25@gmail.com</span>
            </a>
            <a href="mailto:voltsniger@gmail.com" class="btn-contact email">
              <span>voltsniger@gmail.com</span>
            </a>
          </div>
        </div>
        <div class="contact-card fade-in" style="animation-delay:.2s">
          <div class="contact-icon">📍</div>
          <h3>Localisation</h3>
          <p><strong>Niamey, Niger</strong><br>Lun – Sam · 8h – 20h</p>
          <a href="https://maps.google.com/?q=Niamey,Niger" target="_blank" class="btn-contact" style="background:var(--bg);color:var(--text);border:1.5px solid var(--border)">Voir sur Google Maps</a>
        </div>
        <div class="contact-card fade-in" style="animation-delay:.3s">
          <div class="contact-icon">💰</div>
          <h3>Paiement</h3>
          <p>Paiement sécurisé en FCFA<br>Orange Money · Wave · TMoney</p>
          <span class="badge-fcfa">XOF / FCFA</span>
        </div>
      </div>
    </div>
  `;
}
