const yaml = require('js-yaml');
const fs   = require('fs');

const build = require('./build');
const icons = require('./icons');
const images = require('./images');
const openGraph = require('./open-graph');
const parse = require('./parse');
const sass = require('./sass');
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
    data: './content/_data/',
    files: ['images', 'sass', 'time'],
  };

  const data = loadData(opts.data, opts.files);

  // plugins
  eleventyConfig.addPlugin(build);
  eleventyConfig.addPlugin(icons);
  eleventyConfig.addPlugin(openGraph);
  eleventyConfig.addPlugin(parse);

  // assets
  eleventyConfig.addPlugin(time, data.time);
  eleventyConfig.addPlugin(images, data.images);
  eleventyConfig.addPlugin(sass, { sassIn: data.sass.folder });

  eleventyConfig.addDataExtension('yml, yaml', (contents) =>
    yaml.load(contents),
  );
}
