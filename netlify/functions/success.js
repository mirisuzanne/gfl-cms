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

const apiBase = environment === 'dev'
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

const fetch = require("node-fetch");
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
    let response = {};

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
      const fields = eventObject.custom_fields || [];
      const order = items.data[0];
      const product = order.price.product;

      const noteField = fields.find((field) => field.key === 'note');
      const nameField = fields.find((field) => field.key === 'name');
      const name = nameField?.text.value || session.customer_details.name;

      const customer = {
        name,
        email: session.customer_details.email,
      };

      const payment = {
        name: product.name || 'no product',
        total: session.amount_total / 100,
        unit: order.price.unit_amount / 100,
        count: order.quantity,
        type: product.metadata.type,
        recurring: product.metadata.recurring,
        note: noteField?.text.value,
      }

      // send to strapi
      if (payment.type === 'ticket') {
        const ticketSale = {
          data: {
            name,
            email: customer.email,
            seats: payment.count,
            paid: payment.total,
            note: payment.note,
            stripeID: session.payment_intent,
          }
        }

        const makeTicket = await fetch(`${apiBase}/tickets`, {
          method: 'POST',
          body: JSON.stringify(ticketSale),
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.STRAPI_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const ticket = await makeTicket.json();

        response.ticket = ticket;

        const eventID = session.metadata.eventID;
        const optionID = session.metadata.optionID;

        const strapiEvent = {
          data: {
            option: [
              {
                id: optionID,
                tickets: {
                  connect: [ticket.data.id]
                }
              }
            ]
          }
        };

        const eventResponse = await fetch(`${apiBase}/events/${eventID}`, {
          method: 'PUT',
          body: JSON.stringify(strapiEvent) ,
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.STRAPI_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const eventData = await eventResponse.json();

        response.event = eventData;
      }

      // send to notion
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
            'Name': { title: [{ text: { content: customer.name }}] },
            'Email': { email: customer.email },
          },
        });

      const notionResponse = await notion.pages.create({
        parent: { database_id: paymentDb },
        properties: {
          'Name': { title: [{ text: { content: name }}] },
          'Note': { rich_text: [{ text: { content: payment.note || '' }}]},
          'Follow-up': { status: { name: 'todo' }},
          'Product': { rich_text: [{ text: { content: payment.name || 'unknown' }}]},
          'ID': { rich_text: [{ text: { content: product.id || 'unknown' }}]},
          'Type': { select: { name: payment.type || 'unknown' }},
          'Recurring': { select: { name: payment.recurring || 'no' }},
          'Unit': { number: payment.unit || payment.total },
          'Count': { number: payment.count || 1 },
          'Customer': { relation: [{ id: person.id }]}
        },
      });

      response.notion = notionResponse;

      return {
        statusCode: 200,
        body: JSON.stringify(response),
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
