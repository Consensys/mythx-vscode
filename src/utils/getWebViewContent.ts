import { syntaxHighlight } from "./syntaxHighlight"

export function getWebviewContent(data) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Analysis result</title>
  </head>
  <style>
  h1 {color: red;}
  pre { padding: 5px; margin: 5px; }
.string { color: #00C000; }
.number { color: darkorange; }
.boolean { color: blue; }
.null { color: magenta; }
.key { color: #F92572; }
</style>
  <body>
        <h2>Detailed analysis of smart contract:</h2>
        <pre id="json">${syntaxHighlight(JSON.stringify(data, undefined, 2))}</pre>
  </body>
  </html>`;
}