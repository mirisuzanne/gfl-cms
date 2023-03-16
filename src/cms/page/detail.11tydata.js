module.exports = {
  permalink: function(data) {
    return this.permaSlug(data.cms);
  },
  eleventyComputed: {
    slug:  data => data.cms.slug,
    type: data => data.cms.type,
  }
};
