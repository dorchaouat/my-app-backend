const styles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
      max-width: 400px;
      margin: auto;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      padding: 28px;
    }

    h2 {
      font-size: 18px;
      margin-bottom: 24px;
    }

    label {
      display: inline-block;
      margin-bottom: 8px;
    }

    input {
      width: 66%;
      padding: 12px;
    }

    button {
      background: #3845db;
      color: white;
      padding: 8px 12px;
      border: none;
      cursor: pointer;
      width: 33%;
    }

    .required::after {
      content: ' *'
    }

    #formInput {
      display: flex;
      gap: 8px;
    }
  </style>
`;

const formHtml = `
  <div>
    <h2>Leave your email and join our mailing list</h2>
    <label for="email" class="required">Your Email Address:</label>
    <div id="formInput">
      <input type="email" id="email" placeholder="Enter your email" required>
      <button id="subscribeBtn">Subscribe</button>
    </div>
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
  };

  async subscribe() {
    const wixConfig = JSON.parse(this.getAttribute('wixconfig') || '{}');
    const emailInput = this.shadowRoot.getElementById('email');
    const email = emailInput.value;

    if (email) {
      await fetch(`https://my-app-backend-br8l.onrender.com/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: wixConfig.instanceId,
          email,
        }),
      });

      this.shadowRoot.innerHTML = `
        ${styles}
        ${thankYouHtml}
      `
    };
  };
};

customElements.define('subscribe-form', SubscribeForm);
