const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const context = {
  dev: {
    base: 'http://127.0.0.1:1337/api/',
    auth: process.env.STRAPI_KEY_DEV
  },
  production: {
    base: 'https://grapefruitlab-cms.fly.dev/api/',
    auth: process.env.STRAPI_KEY,
  }
};

const api = context[process.env.CONTEXT] || context.production;
const get = 'shows';

const populate = qs.stringify(
  {
    populate: {
      header: {
        populate: {
          hero: { populate: '*' },
        },
      },
      events: {
        populate: {
          option: { populate: '*', },
        },
      },
      press: {
        populate: {
          quote: { populate: '*', },
        },
      },
      venue: { populate: '*' },
      content: {
        populate: {
          venue: { populate: '*' },
          cite: { populate: '*' },
          gallery: {
            populate: {
              figure: { populate: '*' },
            },
          },
          figure: { populate: '*' },
          formFields: { populate: '*' },
        },
      },
    },
  },
  {
    encodeValuesOnly: true,
  }
);

const getRuns = async () => {
  const runResponse = await EleventyFetch(`${api.base}${get}?${populate}`, {
    type: 'json',
    duration: '0s',
    fetchOptions: {
      headers: { Authorization: `Bearer ${api.auth}` },
    },
  });

  return runResponse.data.map((item) => {
    const show = item.attributes;
    show.id = item.id;
    return show;
  });
}

// coda
const coda = {
  api: 'https://coda.io/apis/v1',
  auth: process.env.CODA_API,
  table: 'Events',
};

const getTickets = async (doc) => {
  const path = `${doc}/tables/${coda.table}/rows?useColumnNames=true&query=Live:true`;

  const events = await EleventyFetch(
    `${coda.api}/docs/${path}`, {
    type: 'json',
    duration: '0s',
    fetchOptions: {
      headers: { Authorization: `Bearer ${coda.auth}` },
    },
  });

  return events.items;
}

const eventTickets = async (show) => {
  const eventResponse = await getTickets(show.tickets);

  return eventResponse.map((event) => {
    event.type = 'event';
    event.slug = event.values.DateTime.split(':')[0];
    event.show = show;

    return event;
  });
}

module.exports = async function() {
  try {
    const shows = await getRuns();
    const onSale = shows.filter((show) => show.onSale && show.tickets);

    let events = [];

    for (const show of onSale) {
      const showEvents = await eventTickets(show);
      events = [...events, ...showEvents];
    }

    return { shows, events };
  } catch (error) {
    console.error({error});
  }
};
