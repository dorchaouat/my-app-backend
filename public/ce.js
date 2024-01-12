const styles = `
  <style>
    :host {
      display: block;
      max-width: 300px;
      margin: auto;
      font-family: 'Roboto', sans-serif;
    }

    h2 {
      font-size: 18px;
    }

    input {
      width: 100%;
      margin-bottom: 10px;
      padding: 8px;
    }

    button {
      font-size: 12px;
      padding: 8px 12px;
      cursor: pointer;
    }
  </style>
`;

const formHtml = `
  <div id="subscribeForm">
    <h2>Subscribe</h2>
    <label for="email">Email:</label>
    <input type="email" id="email" required>
    <button id="subscribeBtn">Subscribe</button>
  </div>
`;

const thankYouHtml = `
  <div id="thankYouMessage">
    <h2>Thank You!</h2>
    <p>You have successfully subscribed.</p>
  </div>
`;

class SubscribeForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  };

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      ${styles}
      ${formHtml}
    `;

    this.shadowRoot.getElementById('subscribeBtn').addEventListener('click', () => this.subscribe());
    // this.shadowRoot.getElementById('getSubscriptions').addEventListener('click', () => this.getSubscriptions());
  };

  async subscribe() {
    const wixConfig = JSON.parse(this.getAttribute('wixconfig') || '{}');
    const emailInput = this.shadowRoot.getElementById('email');
    const email = emailInput.value;

    console.log("WIX CONFIG", wixConfig);

    if (email) {
      const subResponse = await fetch(`https://my-app-backend-br8l.onrender.com/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: wixConfig.instanceId,
          email,
        }),
      }).then(res => res.json());

      console.log("SUB RESPONSE", subResponse);

      this.shadowRoot.innerHTML = `
        ${styles}
        ${thankYouHtml}
      `
    };
  };

  async getSubscriptions() {
    const wixConfig = JSON.parse(this.getAttribute('wixconfig') || '{}');
    console.log("WIX CONFIG", wixConfig);

    const subResponse = await fetch(`https://my-app-backend-br8l.onrender.com/subscriptions?instanceId=32a1ff5d-2934-4505-aae4-02b95f88a093`).then(res => res.json());

    console.log("SUB RESPONSE", subResponse);
  };
};

customElements.define('subscribe-form', SubscribeForm);
