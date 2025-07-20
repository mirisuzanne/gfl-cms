import 'dotenv/config';

import config from './plugins/config.js';

export default function (eleventyConfig) {
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
