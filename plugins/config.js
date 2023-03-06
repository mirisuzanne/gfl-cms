const yaml = require('js-yaml');
const fs   = require('fs');
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const pluginWebc = require("@11ty/eleventy-plugin-webc");

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
      console.log(e);
    }
  });

  return data;
}

module.exports = (eleventyConfig) => {
  const opts = {
    data: './src/_data/',
    files: ['images', 'sass', 'time'],
  };

  eleventyConfig.addPassthroughCopy({
    './src/_assets/fonts': 'fonts',
    './src/_assets/js': 'js',
    './src/_assets/favicons/*.*': './',
    "./node_modules/@11ty/is-land/is-land.js": "js/is-land.js"
  });

  const data = loadData(opts.data, opts.files);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_includes/components/**/*.webc",
  });

  // plugins
  eleventyConfig.addPlugin(build);
  eleventyConfig.addPlugin(cms);
  eleventyConfig.addPlugin(icons);
  eleventyConfig.addPlugin(openGraph);
  eleventyConfig.addPlugin(parse);
  eleventyConfig.addPlugin(tickets);

  // assets
  eleventyConfig.addPlugin(time, data.time);
  eleventyConfig.addPlugin(images, data.images);
  eleventyConfig.addPlugin(sass, { sassIn: data.sass.folder });

  eleventyConfig.addDataExtension('yml, yaml', (contents) =>
    yaml.load(contents),
  );
}
