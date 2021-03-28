export function parseHTML(html: string): HTMLElement {
  const context = document.implementation.createHTMLDocument();

  // Set the base href for the created document so any parsed elements with URLs
  // are based on the document's URL
  const base = context.createElement('base');
  base.href = document.location.href;
  context.head.appendChild(base);

  context.body.innerHTML = html;

  return context.body;
}

export function tpl(template: string): (param: { [key: string]: any }) => string {
  return param => new Function(...Object.keys(param), 'return `' + template + '`')(...Object.values(param));
}

export async function sleep(time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export function formatPageNumber(num: number | string, length: number): string {
  let name = String(num);

  for (let len = length - name.length; len > 0; len--) {
    name = '0' + name;
  }

  return name;
}

export async function* createPromisePool<T>(
  executors: Array<() => Promise<T>>,
  limit: number
): AsyncGenerator<T, void, unknown> {
  const running: Array<Promise<T>> = [];

  const invoker = (executor: () => Promise<T>) => {
    running.push(
      executor().finally(() => {
        if (executors.length) {
          invoker(executors.shift());
        }
      })
    );
  };

  executors.splice(0, limit).forEach(invoker);

  while (running.length) {
    yield running.shift();
  }
}
