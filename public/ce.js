const styles = `
  <style>
    :host {
      display: block;
      max-width: 300px;
      margin: auto;
    }

    h2 {
      font-size: 1.2em;
    }

    input {
      width: 100%;
      margin-bottom: 10px;
      padding: 8px;
    }

    button {
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

    this.shadowRoot.innerHTML = `
      ${styles}
      ${formHtml}
    `;

    this.shadowRoot.getElementById('subscribeBtn').addEventListener('click', () => this.subscribe());
  }

  async subscribe() {
    const emailInput = this.shadowRoot.getElementById('email');
    const email = emailInput.value;

    if (email) {
      await fetch('https://jsonplaceholder.typicode.com/todos/1')
        .then(response => response.json())
        .then(json => console.log(json))

      this.shadowRoot.innerHTML = `
        ${styles}
        ${thankYouHtml}
      `
    }
  }
}

customElements.define('subscribe-form', SubscribeForm);
