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
const stampToDate = (stamp) => new Date(stamp * 1000).toLocaleDateString('en-CA');
const centsToDollars = (amt) => amt / 100;

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

const codaRowPost = async (table, data, key = 'ID') => {
  const response = await fetch(`${table}/rows`, {
    method: 'POST',
    body: JSON.stringify({
      rows: [codaRow(data)],
      keyColumns: [key],
    }),
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${coda.auth}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
};

// tickets
const recordTicket = async (session) => {
  return await codaRowPost(
    `${coda.base}/docs/${session.doc}/tables/${coda.ticket.table}`,
    {
      ID: session.id,
      Event: session.event,
      Name: session.name,
      Tickets: session.tickets,
      Paid: session.paid,
      Notes: session.notes,
    }
  );
};

// donor
const donorAddress = (address) => ({
  Street1: address.line1,
  Street2: address.line2,
  Locality: address.city,
  Region: address.state,
  Postal: address.postal_code,
  Country: address.country,
});

const sessionDonor = (session) => {
  const shipping = session.customer_shipping || session.shipping || session.customer_details;
  const address = donorAddress(shipping?.address || {});

  return {
    ID: session.customer || session.customer_details.email,
    Email: session.customer_details.email,
    Name: session.customer_details.name,
    ...address,
  }
};

const recordDonor = async (donor) => {
  return await codaRowPost(
    `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.donor}`,
    donor
  );
}

// single donation
const recordDonation = async (donation) => {
  return await codaRowPost(
    `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.single}`,
    donation
  );
};

// monthly donation
const recordMonthly = async (monthly) => {
  return await codaRowPost(
    `${coda.base}/docs/${coda.donation.doc}/tables/${coda.donation.monthly}`,
    monthly
  );
};

// checkout complete
const onCheckoutComplete = async (stripeEvent) => {
  const eventObject = stripeEvent.data.object;

  const session = await stripe.checkout.sessions.retrieve(eventObject.id, {
    expand: ['line_items.data.price.product'],
  });

  const sale = session.line_items.data[0];

  switch (sale.price.product.metadata.type) {
    // case 'ticket':
    //   const ticket = await recordTicket(session);
    //   return eventSuccess(ticket);

    case 'donation':
      const donor = await recordDonor(
        sessionDonor(session)
      );
      const donation = await recordDonation({
        ID: session.payment_intent,
        Donor: session.customer_details.name,
        Date: stampToDate(session.created),
        Amount: centsToDollars(session.amount_total),
      });
      return eventSuccess({donor, donation});

    case 'monthly':
      const sponsor = await recordDonor(
        sessionDonor(session)
      );
      const subscription = await recordMonthly({
        ID: session.subscription,
        Donor: session.customer_details.name,
        Created: stampToDate(session.created),
        Amount: centsToDollars(session.amount_total),
      });
      return eventSuccess({sponsor, subscription});

    default:
      return eventUnknown(session);
  };
};

// invoice paid
const onInvoicePaid = async (stripeEvent) => {
  const invoice = stripeEvent.data.object;

  const subscription = await recordMonthly({
    ID: invoice.subscription,
    Paid: stampToDate(invoice.status_transitions.paid_at),
    Status: 'Active',
  });

  return eventSuccess({subscription});
};

const onMonthlyDeleted = async (stripeEvent) => {
  const invoice = stripeEvent.data.object;

  const subscription = await recordMonthly({
    ID: invoice.subscription,
    Status: 'Deleted',
  });

  return eventSuccess({subscription});
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
        return await onCheckoutComplete(stripeEvent);
      case "invoice.paid":
        return await onInvoicePaid(stripeEvent);
      case "customer.subscription.deleted":
        return await onMonthlyDeleted(stripeEvent);
      default:
        return eventUnknown(stripeEvent.type);
    };

  } catch (error) {
    console.error(`Stripe webhook failed with ${error}.`);
    return eventError(error);
  }
};
