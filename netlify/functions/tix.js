// Coda Setup:
// - Table named 'Events'
// - Column named 'Left'
// Query Parameters:
// - doc = <document ID>
// - event = <event name or ID>

const fetch = require("node-fetch");

const api = {
  base: 'https://coda.io/apis/v1',
  auth: process.env.CODA_API,
};

const coda = {
  table: 'Events',
  column: 'Left',
};

const codaFetch = async (url) => {
  const response = await fetch(
    url,
    { headers: { Authorization: `Bearer ${api.auth}` } }
  );

  return await response.json();
};

const codaAPI = async (store) => {
  let url = `${api.base}/docs`;

  if (store.doc) { url = `${url}/${store.doc}`; }
  if (store.table) { url = `${url}/tables/${store.table}`; }

  if (store.row) { url = `${url}/rows/${store.row}`; }
  else if (store.column) { url = `${url}/columns/${store.column}`; }

  return await codaFetch(url);
};

const getTix = async (doc, row) => {
  const rowData = await codaAPI({
    doc, row,
    table: coda.table,
  });
  const column = await codaAPI({
    doc,
    ...coda,
  });

  return rowData.values[column.id];
}

exports.handler = async function (event, context) {
  try {
    const params = new URLSearchParams(event.rawQuery);

    const ids = {
      doc: params.get('doc'),
      row: params.get('event'),
    };

    const tix = await getTix(ids.doc, ids.row);

    return {
      statusCode: 200,
      body: JSON.stringify({tix}),
    };

  } catch (e) {
    console.error(e);

    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
}

