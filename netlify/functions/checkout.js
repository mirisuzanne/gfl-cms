const environment = process.env.CONTEXT;

const siteBase = environment !== "production"
  ? (environment === "dev" ? 'http://localhost:8888' : process.env.DEPLOY_PRIME_URL)
  : process.env.URL;

const apiBase = environment === 'dev'
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

const api_key = environment !== "production"
  ? process.env.STRIPE_TEST_KEY
  : process.env.STRIPE_SECRET_KEY;

const fetch = require("node-fetch");
const stripe = require("stripe")(api_key);

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
  const response = await fetch(`${apiBase}/ticket-sales/`);
  const data = await response.json();
  const cmsEvent = data.find((item) => `${item.id}` === eventID);
  const option = cmsEvent.option.find((opt) => `${opt.id}` === optionID);
  const productMax = option.seats - option.sold;

  // create a checkout flow in stripe
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product: productID,
          unit_amount: price * 100,
        },
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: productMax || max,
        },
        quantity: count,
      },
    ],
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
    success_url: `${siteBase}/checkout/success/`,
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
