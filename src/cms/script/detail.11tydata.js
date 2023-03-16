module.exports = {
  permalink: function(data) {
    return this.permaSlug(data.cms, 'script');
  },
  eleventyComputed: {
    byline: data => data.cms.byline,
    show: data => data.cms.show.data,
    show_slug: data => data.cms.show_slug,
    show_title: data => data.cms.show.data.attributes.title,
    show_link: data => `/shows/${data.show_slug}/`,
    showTitle: data => data.cms.show.data.attributes.title,
  }
};
