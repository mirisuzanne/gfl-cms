const yaml = require('js-yaml');
const fs   = require('fs');
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginWebc = require('@11ty/eleventy-plugin-webc');

const build = require('./build');
const cms = require('./cms');
const icons = require('./icons');
const images = require('./images');
const openGraph = require('./open-graph');
const parse = require('./parse');
const sass = require('./sass');
const tickets = require('./tickets');
const time = require('./time');

const loadData = (path, files) => {
  const data = {};

  files.forEach(file => {
    try {
      const fileData = yaml.load(
        fs.readFileSync(`${path}${file}.yaml`, 'utf8')
      );
      data[file] = fileData;
    } catch (e) {
      console.error(e);
    }
  });

  return data;
}

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy({
    './src/_assets/fonts': 'fonts',
    './src/_assets/js': 'js',
    './src/_assets/favicons/*.*': './',
  });

  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addJavaScriptFunction('absoluteUrl', pluginRss.absoluteUrl);
  eleventyConfig.addPlugin(pluginWebc, {
    components: [
      'src/_includes/**/*.webc',
      'npm:@terriblemia/track-list/**/*.webc',
    ],
  });

  // plugins
  eleventyConfig.addPlugin(build);
  eleventyConfig.addPlugin(cms);
  eleventyConfig.addPlugin(icons);
  eleventyConfig.addPlugin(openGraph);
  eleventyConfig.addPlugin(parse);
  eleventyConfig.addPlugin(tickets);

  // assets
  const assets = loadData(
    './src/_data/',
    ['images', 'sass', 'time']
  );
  eleventyConfig.addPlugin(time, assets.time);
  eleventyConfig.addPlugin(images, assets.images);
  eleventyConfig.addPlugin(sass, { sassIn: assets.sass.folder });

  eleventyConfig.addDataExtension('yml, yaml', (contents) =>
    yaml.load(contents),
  );
}
