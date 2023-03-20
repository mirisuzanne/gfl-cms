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

      const shipping = session.customer_shipping || session.shipping || session.customer_details;
      const address = shipping && shipping.address ? {
        street1: shipping.address.line1,
        street2: shipping.address.line2,
        locality: shipping.address.city,
        region: shipping.address.state,
        postal_code: shipping.address.postal_code,
        country: shipping.address.country,
      } : {};

      const customer = {
        name,
        email: session.customer_details.email,
        ...address,
      };

      const payment = {
        name: product.name || 'no product',
        id: session.payment_intent,
        total: session.amount_total / 100,
        unit: order.price.unit_amount / 100,
        count: order.quantity,
        type: product.metadata.type,
        recurring: product.metadata.recurring,
        note: session.metadata.note || noteField?.text.value,
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
            stripeID: payment.id,
            productName: payment.name,
          }
        }

        const getTickets = await fetch(`${apiBase}/tickets/`, {
          headers: {
            Authorization: `Bearer ${process.env.STRAPI_KEY}`,
          },
        });
        const theTickets = await getTickets.json();
        const foundTicket = theTickets.data.find((ticket) => {
          return ticket.attributes.stripeID === payment.id;
        });

        if (foundTicket) {
          const makeTicket = await fetch(`${apiBase}/tickets/${foundTicket.id}`, {
            method: 'PUT',
            body: JSON.stringify(ticketSale),
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${process.env.STRAPI_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          const putTicket = await makeTicket.json();
          response.ticket = putTicket.data;
        } else {
          const makeTicket = await fetch(`${apiBase}/tickets`, {
            method: 'POST',
            body: JSON.stringify(ticketSale),
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${process.env.STRAPI_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          const newTicket = await makeTicket.json();
          response.ticket = newTicket.data;
        }

        const eventID = session.metadata.eventID;
        const optionID = session.metadata.optionID;

        const strapiEvent = {
          data: {
            option: [
              {
                id: optionID,
                tickets: {
                  connect: [response.ticket.id]
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

      // notion address
      const notionAddress = {
        'Street-1': { rich_text: [{ text: { content: customer.street1 || '' }}]},
        'Street-2': { rich_text: [{ text: { content: customer.street2 || '' }}]},
        'Locality': { rich_text: [{ text: { content: customer.locality || '' }}]},
        'Region': { rich_text: [{ text: { content: customer.region || '' }}]},
        'PostalCode': { rich_text: [{ text: { content: customer.postal_code || '' }}]},
        'Country': { rich_text: [{ text: { content: customer.country || '' }}]},
      };

      // notion customer
      const notionPersonList = await notion.databases.query({
        database_id: customerDb,
        filter: {
          property: 'Email',
          rich_text: {
            contains: customer.email
          }
        },
      });

      const notionPerson = notionPersonList.results.length > 0
        ? notionPersonList.results[0]
        : null;

      const notionPersonProps = {
        'Name': { title: [{ text: { content: customer.name }}] },
        'Email': { email: customer.email },
        ...notionAddress,
      };

      if (notionPerson) {
        const patchPerson = await notion.pages.update({
          page_id: notionPerson.id,
          properties: notionPersonProps,
        });
        response.notionPerson = patchPerson;
      } else {
        const newPerson = await notion.pages.create({
          parent: { database_id: customerDb },
          properties: notionPersonProps,
        });
        response.notionPerson = newPerson;
      }

      // notion payment
      const notionPaymentList = await notion.databases.query({
        database_id: paymentDb,
        filter: {
          property: 'paymentID',
          rich_text: {
            contains: payment.id
          }
        },
      });

      const notionPayment = notionPaymentList.results.length > 0
        ? notionPaymentList.results[0]
        : null;

      const notionPaymentProps = {
        'Name': { title: [{ text: { content: name }}] },
        'Note': { rich_text: [{ text: { content: payment.note || '' }}]},
        'Status': { status: {
          name: payment.type === 'ticket' ? 'will call' : 'todo'
        }},
        'Product': { rich_text: [{ text: { content: payment.name || 'unknown' }}]},
        'ID': { rich_text: [{ text: { content: product.id || 'unknown' }}]},
        'paymentID': { rich_text: [{ text: { content: payment.id }}]},
        'Type': { select: { name: payment.type || 'unknown' }},
        'Recurring': { select: { name: payment.recurring || 'one-time' }},
        'Unit': { number: payment.unit || payment.total },
        'Count': { number: payment.count || 1 },
        'Customer': { relation: [{ id: response.notionPerson.id }]}
      };

      if (notionPayment) {
        const patchPayment = await notion.pages.update({
          page_id: notionPayment.id,
          properties: notionPaymentProps,
        });
        response.notionPayment = patchPayment;
      } else {
        const newPayment = await notion.pages.create({
          parent: { database_id: paymentDb },
          properties: notionPaymentProps,
        });
        response.notionPayment = newPayment;
      }

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
