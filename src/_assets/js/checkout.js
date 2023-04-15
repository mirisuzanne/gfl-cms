const optionForms = document.querySelectorAll('form[action="/api/checkout"]');

const tix = (count) => `ticket${count == 1 ? '' : 's'}`;

const updatePrice = (opt) => {
  if (opt.priceIn.value) {
    const count = opt.countIn.value || 0;
    const total = Number(opt.priceIn.value * count).toFixed(2);
    opt.priceOut.value = `$${total}`;
  } else {
    opt.priceOut.value = opt.priceOutDefault;
  }
}

const updateCount = (opt) => {
  const count = Number(opt.countIn.value || 0);

  if (count >= Number(opt.maxIn.value - 4)) {
    opt.maxWarn.dataset.help = 'visible';
  }

  if (count > Number(opt.maxIn.value)) {
    opt.countIn.value = opt.maxIn.value;
  } else if (count < 1) {
    opt.countIn.value = 1;
  }

  opt.countOut.value = `${opt.countIn.value} ${tix(opt.countIn.value)}`;
  updatePrice(opt);
}

// make sure we're up-to-date
const apiBase = window.location.href.includes('localhost')
  ? 'http://localhost:1337/api'
  : 'https://grapefruitlab-cms.fly.dev/api';

let data = [];

const updateMax = (opt, max) => {
  if (max > 0) {
    opt.maxIn.value = max;
    opt.countIn.setAttribute('max', max);
    opt.maxOut.innerHTML = `${max}`;

    if (max < 4) {
      opt.maxWarn.dataset.help = 'visible';
    }
  } else {
    const soldOut = document.querySelector('#sold-out-template');
    const soldOutClone = soldOut.content.cloneNode(true);
    opt.form.replaceWith(soldOutClone);
  }
}

const updateSales = (opt) => {
  if (data.length > 0) {
    const eventID = opt.form.querySelector('[name=event]');
    const optionID = opt.form.querySelector('[name=option]');
    const event = data.find((item) => `${item.id}` === eventID.value);
    const option = event.option.find((opt) => `${opt.id}` === optionID.value);
    const max = option.seats - option.sold;
    updateMax(opt, max);
  }
}

const getData = async () => {
  try {
    const response = await fetch(`${apiBase}/ticket-sales/`);
    data = await response.json();
  } catch(error) {
    console.log(error);
  }
}

// setup
await getData();
optionForms.forEach((form) => {
  const priceOut = form.querySelector('.total-price');
  const opt = {
    form,
    maxIn: form.querySelector('[name=max]'),
    maxWarn: form.querySelector('.max-warning'),
    maxOut: form.querySelector('.max-warning-count'),
    countIn: form.querySelector('[name=count]'),
    priceIn: form.querySelector('[name=price]'),
    checkOut: form.querySelector('.checkout-summary'),
    countOut: form.querySelector('.total-count'),
    priceOut,
    priceOutDefault: priceOut.innerText,
  }

  updateSales(opt);
  opt.countIn.addEventListener('change', () => updateCount(opt));
  opt.priceIn.addEventListener('change', () => updatePrice(opt));
});
