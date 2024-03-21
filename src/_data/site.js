const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const cms = process.env.CONTEXT == 'dev'
  ? 'http://localhost:1337'
  : 'https://grapefruitlab-cms.fly.dev';

const STRAPI_KEY = process.env.CONTEXT === 'dev'
  ? process.env.STRAPI_KEY_DEV
  : process.env.STRAPI_KEY;

const object = 'site';
const query = qs.stringify(
  {
    populate: {
      header: {
        populate: {
          hero: {
            populate: '*'
          },
        },
      },
    },
  },
  {
    encodeValuesOnly: true,
  }
);

module.exports = async function() {
  try {
    const data = await EleventyFetch(`${cms}/api/${object}?${query}`, {
      type: 'json',
      removeUrlQueryParams: true,
      duration: '0s',
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${STRAPI_KEY}`,
        },
      },
    });

    return data.data.attributes;
  } catch (error) {
    console.log({error});
  }
};
