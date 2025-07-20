export const eleventyComputed = {
  title: data => data.source.data.title,
  subtitle: data => data.source.data.subtitle,
  summary: data => data.source.data.summary,
  hero: data => data.source.data.hero,
};
