const maxIn = document.getElementById('max');
const countIn = document.getElementById('count');
const priceIn = document.getElementById('price');

const checkOut = document.getElementById('checkout-summary');
const priceOut = document.getElementById('total-price');
const countOut = document.getElementById('total-count');
const maxOut = document.getElementById('max-output');

const maxWarn = document.getElementById('max-warn');
const maxWarnCount = document.getElementById('max-warn-count');

const eventID = document.getElementById('eventID');
const apiBase = window.location.href.includes('localhost')
? 'http://localhost:1337/api'
: 'https://grapefruitlab-cms.fly.dev/api';
const api = `${apiBase}/events/${eventID.value}?`;

const updatePrice = () => {
  if (priceIn.value) {
    const count = countIn.value || 0;
    const total = Number(priceIn.value * count).toFixed(2);
    priceOut.value = `$${total}`;
    checkOut.removeAttribute('hidden');
  } else {
    priceOut.value = '(set your own price)';
  }
}

const updateCount = () => {
  const plural = countIn.value == 1 ? '' : 's';
  countOut.value = `${countIn.value} ticket${plural}`;
  updatePrice();
}

const validCount = () => {
  const count = Number(countIn.value || 0);
  if (count >= Number(maxIn.value)) {
    maxWarn.removeAttribute('hidden');
    countIn.value = maxIn.value;
  } else if (count < 1) {
    countIn.value = 1;
  }
  updateCount();
}

const updateMax = (max) => {
  if (max > 0) {
    maxIn.value = max;
    countIn.setAttribute('max', max);
    maxWarnCount.innerHTML = max;
  } else {
    const form = document.getElementById('checkout');
    const soldOut = document.querySelector('#sold-out-template');
    const soldOutClone = soldOut.content.cloneNode(true);
    form.replaceWith(soldOutClone);
  }
}

const getSales = async () => {
  try {
    const response = await fetch(api + new URLSearchParams({ populate: '*' }));
    const data = await response.json();
    const remaining = data.data.attributes.tickets.data.reduce(
      (all, current) => all - current.attributes.seats,
      data.data.attributes.ticketOption.seats
    );
    updateMax(remaining);
  } catch(error) {
    console.log(error);
  }
}

countIn.addEventListener('change', () => validCount());
priceIn.addEventListener('change', () => updatePrice());

getSales();
