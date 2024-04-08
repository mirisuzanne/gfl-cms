const options = {
  production: {
    url: process.env.URL,
    cms: 'https://grapefruitlab-cms.fly.dev/api',
    stripe: process.env.STRIPE_SECRET_KEY,
  },
  dev: {
    url: 'http://127.0.0.1:8888',
    cms: 'http://127.0.0.1:1337/api',
    stripe: process.env.STRIPE_TEST_KEY,
  },
  preview: {
    url: process.env.DEPLOY_PRIME_URL,
    cms: 'https://grapefruitlab-cms.fly.dev/api',
    stripe: process.env.STRIPE_TEST_KEY,
  },
}

const config = options[process.env.CONTEXT] || options.preview;

const fetch = require("node-fetch");
const stripe = require("stripe")(config.stripe);

exports.handler = async function (event, context) {
  const referer = event.headers.referer;
  // JSON.parse doesn't work here
  const params = new URLSearchParams(event.body);
  const eventID = params.get("event");
  const optionID = params.get("option");
  const productID = params.get("product");
  const note = params.get("note");
  const max = parseInt(params.get("max"), 10);
  const count = parseInt(params.get("count"), 10);
  const price = parseFloat(params.get("price"), 10);

  // update the max available
  const response = await fetch(`${config.cms}/ticket-sales/`);
  const data = await response.json();
  const cmsEvent = data.find((item) => `${item.id}` === eventID);
  const option = cmsEvent.option.find((opt) => `${opt.id}` === optionID);
  const productMax = option.seats - option.sold;

  const ticketMax = productMax || max;

  // create a checkout flow in stripe
  const item = {
    price_data: {
      currency: 'usd',
      product: productID,
      unit_amount: price * 100,
    },
    quantity: count,
  };

  if (ticketMax > 1) {
    item.adjustable_quantity = {
      enabled: true,
      minimum: 1,
      maximum: productMax || max,
    };
  }

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
    metadata: { eventID, optionID, note },
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
};
