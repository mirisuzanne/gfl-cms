require('dotenv').config();

const config = require('./plugins/config');

module.exports = function (eleventyConfig) {
  // config
  eleventyConfig.addPlugin(config);
  eleventyConfig.setLiquidOptions({jsTruthy: true});
  eleventyConfig.setQuietMode(true);

  return {
    dir: {
      input: 'src',
      layouts: '_layouts',
    },
  };
};
