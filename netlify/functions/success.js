const environment = process.env.CONTEXT;

const environmentKeys = {
  production: {
    STRIPE_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_KEY: process.env.STRIPE_WEBHOOK_SECRET,
  },
  other: {
    STRIPE_KEY: process.env.STRIPE_TEST_KEY,
    WEBHOOK_KEY: process.env.STRIPE_WEBHOOK_SECRET_TEST,
  },
};

const apiKeys =
  environment !== "production"
    ? environmentKeys.other
    : environmentKeys.production;

const stripe = require("stripe")(apiKeys.STRIPE_KEY);

const { Client } = require("@notionhq/client")
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const customerDb = '528e197502074f0baa125248bb8db6f3';
const paymentDb = '69851cfe879a426baa4e466f3681f3f8';

exports.handler = async function (event, context) {
  const { body, headers } = event;

  try {
    // 1. Check that the request is really from Stripe
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      apiKeys.WEBHOOK_KEY
    );

    // 2. Handle successful payments
    if (stripeEvent.type === "checkout.session.completed") {
      const eventObject = stripeEvent.data.object;

      const session = await stripe.checkout.sessions.retrieve(eventObject.id);
      const items = await stripe.checkout.sessions.listLineItems(
        eventObject.id,
        { expand: ["data.price.product"] }
      );

      // The data to fulfill the order
      const order = items.data[0];
      const product = order.price.product;

      const customer = {
        name: session.customer_details.name || 'no name provided',
        email: session.customer_details.email,
      };

      const payment = {
        name: product.name || 'no product listed',
        unit: order.price.unit_amount / 100,
        count: order.quantity,
        type: product.metadata.type,
      }

      const notionCustomer = await notion.databases.query({
        database_id: customerDb,
        filter: {
          property: 'Email',
          rich_text: {
            contains: customer.email
          }
        },
      });

      const person = notionCustomer.results.length > 0
        ? notionCustomer.results[0]
        : await notion.pages.create({
          parent: { database_id: customerDb },
          properties: {
            'Name': {title: [{text: {content: customer.name}}] },
            'Email': {email: customer.email},
          },
        });

      const response = await notion.pages.create({
        parent: { database_id: paymentDb },
        properties: {
          'Name': {title: [{text: {content: payment.name}}] },
          'Follow-up': {status: {name: 'todo'}},
          'Type': {select: {name: payment.type || 'unknown'}},
          'Unit': {number: payment.unit},
          'Count': {number: payment.count},
          'Customer': {
            relation: [
              { id: person.id },
            ]
          }
        },
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ response }),
      };
    }

    return {
      statusCode: 400,
      body: `Unknown event type: &{stripeEvent.type}`,
    }

  } catch (err) {
    console.error(`Stripe webhook failed with ${err}.`);

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    }
  }
};
