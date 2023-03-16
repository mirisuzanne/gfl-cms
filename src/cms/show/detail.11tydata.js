module.exports = {
  permalink: function(data) {
    return this.permaSlug(data.cms, 'show');
  },
};
