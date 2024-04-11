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

const fetch = require("node-fetch");
const stripe = require("stripe")(config.stripe);

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

exports.handler = async function (event, context) {
  try {
    const referer = event.headers.referer;

    // JSON.parse doesn't work here
    const params = new URLSearchParams(event.body);
    const docID = params.get("docID");
    const eventID = params.get("eventID");
    const productID = params.get("ticketID");
    const note = params.get("note");
    const max = parseInt(params.get("max"), 10);
    const count = parseInt(params.get("count"), 10);
    const price = parseFloat(params.get("price"), 10);

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
      custom_fields: [
        {
          key: 'name',
          label: {
            type: 'custom',
            custom: 'Reservation Name',
          },
          type: 'text',
          optional: true,
        },
      ],
      metadata: { docID, eventID, note },
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
};
