const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const cms = process.env.CONTEXT == 'dev'
  ? 'http://localhost:1337'
  : 'https://grapefruitlab-cms.fly.dev';

const object = 'nav';
const query = qs.stringify({
  populate: {
    items: {
      populate: '*'
    },
  },
});

module.exports = async function() {
  try {
    const data = await EleventyFetch(`${cms}/api/${object}?${query}`, {
      type: 'json',
      duration: '0s',
      removeUrlQueryParams: true,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_KEY}`,
        },
      },
    });

    return data.data.attributes.items;
  } catch (error) {
    console.log({error});
  }
};
