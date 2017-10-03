// The grand fantastic library
const puppeteer = require("puppeteer");

// My brain is 80% RxJS at this point, you'll see how I use it below
const spawnRx = require("spawn-rx");

// Will use this for coloring output
const chalk = require("chalk");

// Operators for use with the spawned notebook server
require("rxjs/add/operator/filter");
require("rxjs/add/operator/share");
require("rxjs/add/operator/toPromise");
require("rxjs/add/operator/first");

async function main() {
  // We could/should generate this, I'm just setting it here to demonstrate
  const TOKEN = "applesaucemcgee";

  const jupyter$ = spawnRx
    .spawn("jupyter", [
      "notebook",
      "--no-browser",
      `--NotebookApp.token='${TOKEN}'`
    ])
    // we keep one jupyter notebook server running, the share operator
    // allows us to subscribe to this stream multiple times while only launching
    // one server for all N subscriptions
    .share();

  // Log everything from the notebook server, dimming it for readability amongst
  // our own output
  const d1 = jupyter$.subscribe(data => console.log(chalk.dim(data)));

  // Wait for the server to be up by waiting for the "Welcome" banner
  const p = jupyter$
    .filter(x => /Welcome to Project Jupyter/.test(x))
    .first()
    .toPromise();
  // Note that we could have used the above filtering to get the URL of the
  // notebook server -- port, token, and all

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`http://127.0.0.1:8888/tree?token=${TOKEN}`);
  } catch (error) {
    // In case we can't connect to the notebook server, we should exit early
    console.error(error);
    d1.unsubscribe();
    return;
  }

  // Get the version!
  const version = await page.evaluate(() => {
    return Jupyter.version;
  });
  console.log("Jupyter version: ", version);

  // Take a snap!
  await page.screenshot({ path: "example.png" });

  // Clean up!
  await browser.close();
  d1.unsubscribe();
  console.log("cleaned up nicely");
}

main().catch(e => console.error("Main errored", e));
