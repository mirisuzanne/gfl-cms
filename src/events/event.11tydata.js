const dateFormat = require('date-fns/format');

const getHero = (src) => src.header?.hero.data?.attributes;
const getTitle = (data) => dateFormat(
  new Date(data.event.values.DateTime),
  data.time.event
);
const getSubTitle = (data) => {
  const showTitle = `[${data.event.show.title}](../)`;
  return data.soldOut
    ? `${showTitle} | **SOLD OUT**`
    : `Tickets for ${showTitle}`;
}

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
    soldOut: (data) => data.event.values.Left < 1,
    title: (data) => getTitle(data),
    subtitle: (data) => getSubTitle(data),
    summary: (data) => data.event.show.header?.summary,
    hero: (data) => getHero(data.event.show) || getHero(data.site),
    date: (data) => data.event.values.DateTime,
  },
  permalink: function(data) {
    return this.buildURL(data.event);
  },
};