const EleventyFetch = require('@11ty/eleventy-fetch');
const qs = require('qs');

const apiBase = process.env.CONTEXT === 'dev'
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

const STRAPI_KEY = process.env.CONTEXT === 'dev'
  ? process.env.STRAPI_KEY_DEV
  : process.env.STRAPI_KEY;

const get = 'pages';
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
      content: {
        populate: {
          venues: {
            populate: '*'
          },
          cite: {
            populate: '*'
          },
          gallery: {
            populate: {
              figure: {
                populate: '*'
              },
            },
          },
          figure: {
            populate: '*'
          },
          formFields: {
            populate: '*'
          },
          person: {
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
          page: {
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
        },
      },
    }
  },
  {
    encodeValuesOnly: true,
  }
);

module.exports = async function() {
  try {
    const data = await EleventyFetch(`${apiBase}/${get}?${query}`, {
      type: 'json',
      duration: '0s',
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${STRAPI_KEY}`,
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
    console.error({error});
  }
};
