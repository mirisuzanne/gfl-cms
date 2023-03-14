const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

const getEventSeats = (seats, tickets) => tickets.data.reduce(
  (all, current) => all - current.attributes.seats,
  seats
);

module.exports = function (eleventyConfig, options = {}) {
  eleventyConfig.addFilter('getEventSeats', getEventSeats);

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "dynamic", // The serverless function name from your permalink object
    functionsDir: "./netlify/functions/",
  });
};
