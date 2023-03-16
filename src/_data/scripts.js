const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const apiBase = process.env.CONTEXT == 'dev'
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

const get = 'scripts';
const query = qs.stringify({ populate: '*' }, { encodeValuesOnly: true });

module.exports = async function() {
  try {
    const data = await EleventyFetch(`${apiBase}/${get}?${query}`, {
      type: 'json',
      duration: '0s',
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_KEY}`,
        },
      },
    });

    const cms = data.data.map(item => {
      const data = item.attributes;
      data.id = item.id;
      data.show_slug = data.show.data.attributes.slug;
      return data;
    });
    return cms;
  } catch (error) {
    console.log({error});
  }
};
