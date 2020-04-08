const path = require("path");
const puppeteer = require("puppeteer");
const getPage = require("../../helperFunctions/blockOnPage");
const retry = require("../../helperFunctions/retry");
const Err = require("../../helperFunctions/err");

const acquireDownloadLink2 = async id => {
  const url = `http://steamworkshop.download/download/view/${id}`;
  const browser = await puppeteer.launch();
  let page = await getPage(browser, { script: true });

  forceQuitRetries = false;
  await retry(
    async () => {
      await page.goto(url, { waitUntil: "networkidle2" });
    },
    async () => {
      await page.close();
      page = await getPage(browser);
    },
    async () => {
      await page.close();
      await browser.close();
      throw new Error("Unable to load first download page");
    },
    () => forceQuitRetries
  );

  const downloadButtonExists = await page.$("#steamdownload.button");

  if (!downloadButtonExists) {
    await page.screenshot({
      path: path.join(__logsFolder, "STEAMWORKSHOP-mod-unavailable-for-download.png"),
      fullPage: true
    });
    await page.close();
    await browser.close();
    throw new Err("Mod not available for download", "FAIL")
  }

  try {
    await page.click("#steamdownload.button");
    await page.waitForSelector("#result > pre > a", {
      visible: true,
      timeout: 20000
    });
  } catch {
    await page.close();
    await browser.close();
    throw new Error("Unable to download from steam");
  }

  //CLICKING ON ACTUAL DOWNLOAD BUTTON TO GRAB FILE LINK
  const downloadLink = await page.evaluate(() => {
    return document.querySelector("#result > pre > a").href;
  });

  await page.close();
  await browser.close();
  if (!downloadLink) throw new Error("NO LINK GRABBED");

  return downloadLink;
};

module.exports = acquireDownloadLink2;