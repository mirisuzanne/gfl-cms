const dateFormat = require('date-fns/format');

const getHero = (src) => src.header?.hero.data?.attributes;
const getTitle = (data) => dateFormat(
  new Date(data.event.values.DateTime),
  data.time.event
);

module.exports = {
  layout: 'page',
  tags: ['events'],
  pagination: {
    data: 'runs.events',
    size: 1,
    alias: 'event',
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    title: (data) => `Tickets: ${getTitle(data)}`,
    subtitle: (data) => data.event.show.title,
    summary: (data) => data.event.show.header?.summary,
    hero: (data) => getHero(data.event.show) || getHero(data.site),
    date: (data) => data.event.values.DateTime,
  },
  permalink: function(data) {
    return this.buildURL(data.event);
  },
};
