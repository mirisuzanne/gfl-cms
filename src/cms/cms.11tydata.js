const getHero = (src) => src.header?.hero.data?.attributes;

module.exports = {
  layout: 'cms',
  eleventyComputed: {
    title: (data) => data.cms.title,
    subtitle: (data) => data.cms.header?.subTitle,
    summary: (data) => data.cms.header?.summary,
    hero: (data) => getHero(data.cms) || getHero(data.site),
    date: (data) => data.cms.date,
    end: (data) => data.cms.end,
    id: (data) => data.cms.id,
  },
  permalink: function(data) {
    return this.buildURL(data.cms);
  },
};
