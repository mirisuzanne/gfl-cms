require('dotenv').config();

const plugins = require('./plugins/all');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(plugins);

  eleventyConfig.addPassthroughCopy({
    './content/_assets/fonts': 'fonts',
    './content/_assets/favicons/*.*': './',
  });

  // config
  eleventyConfig.setLiquidOptions({jsTruthy: true});
  eleventyConfig.setQuietMode(true);

  return {
    dir: {
      input: 'content',
      layouts: '_layouts',
    },
  };
};
