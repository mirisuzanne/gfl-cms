const options = {
  production: {
    url: process.env.URL,
    stripe: process.env.STRIPE_SECRET_KEY,
  },
  dev: {
    url: 'http://127.0.0.1:8888',
    stripe: process.env.STRIPE_TEST_KEY,
  },
  preview: {
    url: process.env.DEPLOY_PRIME_URL,
    stripe: process.env.STRIPE_TEST_KEY,
  },
}

const config = options[process.env.CONTEXT] || options.preview;

import fetch from "node-fetch";
import Stripe from 'stripe';
const stripe = new Stripe(config.stripe);

const getTix = async (doc, event) => {
  try {
    const params = {
      doc: encodeURIComponent(doc),
      event: encodeURIComponent(event),
    };

    const url = `${config.url}/api/tix?doc=${params.doc}&event=${params.event}`;
    const response = await fetch(url);

    return await response.json();
  } catch(e) {
    console.error(e);
  }
}

export async function handler (event, context) {
  try {
    const referer = event.headers.referer;

    // JSON.parse doesn't work here
    const params = new URLSearchParams(event.body);
    const docID = params.get("docID");
    const eventID = params.get("eventID");
    const productID = params.get("ticketID");
    const name = params.get("name");
    const email = params.get("email");
    const subscribe = params.get("subscribe");
    const note = params.get("note");
    const max = parseInt(params.get("max"), 10);
    const count = parseInt(params.get("count"), 10);
    const price = parseFloat(params.get("price"), 10);

    const description = params.get("description") || `
      Your reservation is complete!
      There are no tickets involved —
      just give your name when you arrive,
      and enjoy the show.
    `;

    // update the max available
    const data = getTix(docID, eventID);
    const ticketMax = data.tix || max;

    // create a an item for stripe
    const item = {
      price_data: {
        currency: 'usd',
        product: productID,
        unit_amount: price * 100,
      },
      quantity: Math.min(count, ticketMax),
    };

    // only allow editing quantity if there's more available
    if (ticketMax > 1) {
      item.adjustable_quantity = {
        enabled: true,
        minimum: 1,
        maximum: ticketMax,
      };
    }

    // create a checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [ item ],
      metadata: { docID, eventID, name, note, subscribe },
      customer_email: email,
      payment_intent_data: { description },
      mode: "payment",
      success_url: `${config.url}/checkout/success/`,
      // go back to page that they were on
      cancel_url: referer,
    });

    return {
      statusCode: 303,
      headers: {
        Location: session.url,
      },
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
}
