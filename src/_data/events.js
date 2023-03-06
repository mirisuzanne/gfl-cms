const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const apiBase = process.env.CONTEXT == 'dev'
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

const api = 'events';
const query = qs.stringify({ populate: '*' });

module.exports = async function() {
  try {
    const data = await EleventyFetch(`${apiBase}/${api}?${query}`, {
      type: 'json',
      removeUrlQueryParams: true,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_KEY}`,
        },
      },
    });

    const cms = data.data.map(item => {
      const data = item.attributes;
      data.id = item.id;
      return data;
    });
    return cms;
  } catch (error) {
    console.log({error});
  }
};
