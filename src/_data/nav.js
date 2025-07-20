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
const get = 'nav';

const populate = stringify(
  {
    populate: {
      items: { populate: '*' },
    },
  },
  { encodeValuesOnly: true }
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

    const nav = response.data.attributes.items.map((item) => {
      item.page = item.page.data.attributes;
      return item;
    });

    return nav;
  } catch (error) {
    console.error({error});
  }
};
