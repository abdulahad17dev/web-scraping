const fs = require("fs");
const puppeteer = require("puppeteer");
const user_agents = require("./user-agents.json");
const generateRandomUA = () => {
  const userAgents = user_agents;
  const randomUAIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomUAIndex];
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1024,768`],
    protocolTimeout: 24000000,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  const page = await browser.newPage();

  const customUA = generateRandomUA();

  await page.setUserAgent(customUA);

  await page.setViewport({
    width: 1024,
    height: 768,
  });

  // Navigate the page to target website
  await page.goto("https://uzum.uz/ru", { waitUntil: "load" });

  // await page.waitForSelector(".suggestion-priority", {
  //   timeout: 30000,
  // });

  await page.screenshot({ path: "step1.png" });

  await page.waitForSelector(".suggestion-priority .more", {
    timeout: 30000,
  });

  await page.click(".suggestion-priority .more");

  await page.waitForSelector(".ke-catalog .wrapper", {
    timeout: 30000,
  });

  // const categories = await page.$$eval(
  //   ".parent-categories .parent-category-item",
  //   (elements) =>
  //     elements.map((e) => ({
  //       title: e.querySelector(".parent-category-link .title").innerHTML,
  //       url: e.querySelector(".parent-category-link").href,
  //     }))
  // );

  let children_categories = [];

  const elements = await page.$$(".parent-category-item");

  // Loop through the selected elements
  for (const element of elements) {
    await element.hover();

    const items = await page.$$eval(".children-category", (elements) =>
      elements.map((e) => {
        let parent = e
          .querySelector(".children-category-title")
          .parentElement.parentElement.parentElement.querySelector(
            ".category-title"
          ).innerHTML;
        return {
          product_count: 0,
          category: parent.trim(),
          child_category: e
            .querySelector(".children-category-title")
            .innerHTML.trim(),
          url: e.querySelector(".children-category-title").href,
          products: [],
        };
      })
    );

    children_categories = children_categories.concat(items);

    await page.waitForTimeout(2000); // 2 second
  }

  console.log(children_categories);

  for (let index = 0; index < children_categories.length; index++) {
    // const element = children_categories[index];
    // await page.goto(element.url, { waitUntil: "domcontentloaded" });

    const page2 = await browser.newPage();

    const customUA = generateRandomUA();

    await page2.setUserAgent(customUA);

    await page2.setViewport({
      width: 1024,
      height: 768,
    });

    // Navigate the page to target website
    await page2.goto(children_categories[index].url, { waitUntil: "load" });

    const cloudflare = await page2.evaluate(() => {
      const element = document.querySelector(".indent-from-header");
      if (element) {
        return true;
      }
      return false;
    });

    console.log(cloudflare);

    if (cloudflare) {
      await page2.waitForSelector(".products-list .product-card", {
        timeout: 30000,
      });

      // let product_count = await page2.$eval(
      //   ".categories-container .subtitle span",
      //   (element) => {
      //     return element.innerText;
      //   }
      // );

      const product_count = await page2.evaluate(() => {
        const element = document.querySelector(
          ".categories-container .subtitle span"
        );
        if (element) {
          return element.textContent.replace(/\D/g, "");
        }
        return 0;
      });

      children_categories[index].product_count = Number(product_count);

      const getData = () => {
        return page2.evaluate(async () => {
          return await new Promise((resolve) => {
            const element = document.querySelector(".button-more");
            let products = [];
            let interval = setInterval(() => {
              if (window.getComputedStyle(element).display === "inline-flex") {
                element.click();
              } else {
                clearInterval(interval);
                let elements = document.querySelectorAll(".product-card");

                elements.forEach((e) => {
                  products.push({
                    title: e
                      .querySelector(".card-info-block .subtitle a")
                      .innerHTML.trim(),
                    price: Number(
                      e
                        .querySelector(
                          ".card-info-block .product-card-main-info-wrapper .product-card-price"
                        )
                        .innerHTML.replace(/\D/g, "")
                    ),
                    url: e.querySelector(".card-info-block .subtitle a").href,
                    image: e
                      .querySelector(".image-wrapper img")
                      .getAttribute("src"),
                  });
                });

                resolve(products);
              }
            }, 3000);
          });
        });
      };

      let boxes = await getData();

      console.log(boxes);

      // fs.writeFile(
      //   "courses.json",
      //   JSON.stringify(children_categories),
      //   (err) => {
      //     if (err) throw err;
      //     console.log("File saved", boxes);
      //   }
      // );

      // fs.writeFile(
      //   "courses.json",
      //   JSON.stringify(children_categories),
      //   (err) => {
      //     if (err) throw err;
      //     console.log("File saved");
      //   }
      // );

      // await page2.waitForTimeout(5000); // 2 second
      // await page2.close();
    } else await page2.close();
  }

  await page.screenshot({ path: "step2.png" });

  fs.writeFile("courses.json", JSON.stringify(children_categories), (err) => {
    if (err) throw err;
    console.log("File saved");
  });

  await page.close();

  await browser.close();
})();
