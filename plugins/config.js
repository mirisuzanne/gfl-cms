import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { EleventyRenderPlugin } from '@11ty/eleventy';
import pluginRss from '@11ty/eleventy-plugin-rss';
import pluginWebc from '@11ty/eleventy-plugin-webc';

import build from './build.js';
import cms from './cms.js';
import icons from './icons.js';
import images from './images.js';
import openGraph from './open-graph.js';
import parse from './parse.js';
import sass from './sass.js';
import tickets from './tickets.js';
import time from './time.js';

const loadData = (path, files) => {
  const data = {};

  files.forEach(file => {
    try {
      const fileData = load(
        readFileSync(`${path}${file}.yaml`, 'utf8')
      );
      data[file] = fileData;
    } catch (e) {
      console.error(e);
    }
  });

  return data;
}

export default (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy({
    './src/_assets/fonts': 'fonts',
    './src/_assets/js': 'js',
    './src/_assets/favicons/*.*': './',
  });

  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(pluginRss);
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
    load(contents),
  );
}
