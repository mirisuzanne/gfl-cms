import EleventyFetch from '@11ty/eleventy-fetch';
import { stringify } from 'qs';

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
const get = 'site';

const populate = stringify(
  {
    populate: {
      header: {
        populate: {
          hero: { populate: '*' },
        },
      },
    },
  },
  {
    encodeValuesOnly: true,
  }
);

export default async function() {
  try {
    const response = await EleventyFetch(`${api.base}${get}?${populate}`, {
      type: 'json',
      duration: '0s',
      fetchOptions: {
        headers: { Authorization: `Bearer ${api.auth}` },
      },
    });

    const site = response.data.attributes;

    return site;
  } catch (error) {
    console.error({error});
  }
};
