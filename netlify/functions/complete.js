const options = {
  production: {
    url: process.env.URL,
    STRIPE: process.env.STRIPE_SECRET_KEY,
    WEB_HOOK: process.env.STRIPE_WEBHOOK_SECRET,
  },
  dev: {
    url: 'http://localhost:8888',
    STRIPE: process.env.STRIPE_TEST_KEY,
    WEB_HOOK: process.env.STRIPE_WEBHOOK_SECRET_TEST,
  },
  preview: {
    url: process.env.DEPLOY_PRIME_URL,
    STRIPE: process.env.STRIPE_TEST_KEY,
    WEB_HOOK: process.env.STRIPE_WEBHOOK_SECRET_TEST,
  },
};

const config = options[process.env.CONTEXT] || options.dev;

const fetch = require("node-fetch");
const stripe = require("stripe")(config.STRIPE);

const coda = {
  base: 'https://coda.io/apis/v1',
  auth: process.env.CODA_API,
  ticket: {
    table: 'Tickets',
  },
  donation: {
    doc: 'NHloVyv_6V',
    donor: "Donors",
    single: "Single",
    monthly: "Monthly",
  }
};

// utils
const toDate = (stamp) => new Date(stamp * 1000).toLocaleDateString('en-CA');

const toUsd = (amt) => amt / 100;

// replies
const eventUnknown = (type) => ({
  statusCode: 400,
  body: `Unknown event type: ${type}`,
});

const eventError = (error) => ({
  statusCode: 400,
  body: `Webhook Error: ${error.message}`,
});

const eventSuccess = (response) => ({
  statusCode: 200,
  body: JSON.stringify(response),
});

// to coda
const codaPost = async (url, data) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${coda.auth}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
};

const codaRow = (obj) => {
  if (!obj.ID) {
    console.error('Row object should include an ID', obj);
  };

  const cells = [];

  Object.keys(obj).forEach((column) => {
    const value = obj[column];
    if (value) cells.push({ column, value });
  });

  return { cells };
};

// tickets
const recordTicket = async (session) => {
  const tableUrl = `${coda.base}/docs/${session.doc}/tables/${coda.ticket.table}`;

  const ticket = codaRow({
    ID: session.id,
    Event: session.event,
    Name: session.name,
    Tickets: session.tickets,
    Paid: session.paid,
    Notes: session.notes,
  });

  const response = await codaPost(
    `${tableUrl}/rows`,
    {
      rows: [ticket],
      keyColumns: ['ID'],
    }
  );

  return eventSuccess(response);
};

// donor
const recordDonor = async (session) => {
  const tableUrl = `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.donor}`;

  const shipping = session.customer_shipping || session.shipping || session.customer_details;
  const address = shipping?.address || {};

  const donorRow = codaRow({
    ID: session.customer || session.customer_details.email,
    Email: session.customer_details.email,
    Name: session.customer_details.name,

    Street1: address.line1,
    Street2: address.line2,
    Locality: address.city,
    Region: address.state,
    Postal: address.postal_code,
    Country: address.country,
  });

  console.log(donorRow);

  const donor = await codaPost(
    `${tableUrl}/rows`,
    {
      rows: [donorRow],
      keyColumns: ['ID'],
    }
  );

  return donor;
}

// single donation
const recordDonation = async (session) => {
  const donationRow = codaRow({
    ID: session.payment_intent,
    Donor: session.customer_details.name,
    Date: toDate(session.created),
    Amount: toUsd(session.amount_total),
  });

  const tableUrl = `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.single}`;
  const donation = await codaPost(
    `${tableUrl}/rows`,
    {
      rows: [donationRow],
      keyColumns: ['ID'],
    }
  );

  return donation;
};

// monthly donation
const recordMonthly = async (session) => {
  const donationRow = codaRow({
    ID: session.subscription,
    Donor: session.customer_details.name,
    Created: toDate(session.created),
    Amount: toUsd(session.amount_total),
  });

  const tableUrl = `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.monthly}`;
  const donation = await codaPost(
    `${tableUrl}/rows`,
    {
      rows: [donationRow],
      keyColumns: ['ID'],
    }
  );

  return donation;
};

// checkout
const onCheckoutComplete = async (stripeEvent) => {
  const eventObject = stripeEvent.data.object;

  const session = await stripe.checkout.sessions.retrieve(eventObject.id, {
    expand: ['line_items.data.price.product'],
  });

  const sale = session.line_items.data[0];

  switch (sale.price.product.metadata.type) {
    // case 'ticket':
    //   return await recordTicket(session);
    case 'donation':
      const donor = await recordDonor(session);
      const donation = await recordDonation(session);
      return eventSuccess({donor, donation});
    case 'monthly':
      const sponsor = await recordDonor(session);
      const subscription = await recordMonthly(session);
      console.log({sponsor, subscription});
      return eventSuccess({sponsor, subscription});
    default:
      return eventUnknown(session);
  };
};

// handler
exports.handler = async function (event, context) {
  const { body, headers } = event;

  try {
    // Check that the request is really from Stripe
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      config.WEB_HOOK
    );

    // Handle known or unknown event types
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        return onCheckoutComplete(stripeEvent);
      default:
        return eventUnknown(stripeEvent.type);
    };

  } catch (error) {
    console.error(`Stripe webhook failed with ${error}.`);
    return eventError(error);
  }
};
