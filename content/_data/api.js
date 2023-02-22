const contentful = require("contentful");
const client = contentful.createClient({
    space: process.env.CTFL_SPACE,
    accessToken: process.env.CTFL_ACCESSTOKEN
});

module.exports = async function() {
  try {
    const data = await client.getEntry('3UcUgVsbGIEngFKphulrtS');

    return data;
  } catch (error) {
    console.error
  }
};
