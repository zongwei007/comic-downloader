export function parseHTML(html) {
  const context = document.implementation.createHTMLDocument();

  // Set the base href for the created document so any parsed elements with URLs
  // are based on the document's URL
  const base = context.createElement('base');
  base.href = document.location.href;
  context.head.appendChild(base);

  context.body.innerHTML = html;

  return context.body;
}

export function tpl(template) {
  return param => new Function(...Object.keys(param), 'return `' + template + '`')(...Object.values(param));
}

export async function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}

export function formatPageNumber(num, length) {
  let name = String(num);

  for (let len = length - name.length; len > 0; len--) {
    name = '0' + name;
  }

  return name;
}

export function promisePool(limit) {
  let running = 0;
  let pendings = [];

  function call() {
    while (running < limit && pendings.length) {
      const runnable = pendings.shift();

      runnable().finally(() => {
        running--;
        call();
      });

      running++;
    }
  }

  return {
    push(runnable) {
      pendings.push(runnable);

      call();
    },
  };
}
