const puppeteer = require("puppeteer");
const user_agents = require("../../assets/user-agents.json");
const saveProduct = require("../schemas/products");
const generateRandomUA = () => {
  const userAgents = user_agents;
  const randomUAIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomUAIndex];
};

const scrapingProducts = async () => {
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

  await page.goto("https://uzum.uz/ru", { waitUntil: "load" });

  await page.screenshot({ path: "step1.png" });

  await page.waitForSelector(".suggestion-priority .more", {
    timeout: 30000,
  });

  await page.click(".suggestion-priority .more");

  await page.waitForSelector(".ke-catalog .wrapper", {
    timeout: 30000,
  });

  let children_categories = [];

  const elements = await page.$$(".parent-category-item");

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

  for (let index = 0; index < children_categories.length; index++) {
    const page2 = await browser.newPage();

    const customUA = generateRandomUA();

    await page2.setUserAgent(customUA);

    await page2.setViewport({
      width: 1024,
      height: 768,
    });

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

      // const getData = () => {
      //   return page2.evaluate(async () => {
      //     return await new Promise((resolve) => {
      //       const element = document.querySelector(".button-more");
      //       let products = [];
      //       let interval = setInterval(() => {
      //         if (window.getComputedStyle(element).display === "inline-flex") {
      //           element.click();
      //         } else {
      //           clearInterval(interval);
      //           let elements = document.querySelectorAll(".product-card");

      //           elements.forEach((e) => {
      //             products.push({
      //               title: e
      //                 .querySelector(".card-info-block .subtitle a")
      //                 .innerHTML.trim(),
      //               price: Number(
      //                 e
      //                   .querySelector(
      //                     ".card-info-block .product-card-main-info-wrapper .product-card-price"
      //                   )
      //                   .innerHTML.replace(/\D/g, "")
      //               ),
      //               url: e.querySelector(".card-info-block .subtitle a").href,
      //               image: e
      //                 .querySelector(".image-wrapper img")
      //                 .getAttribute("src"),
      //               product_info: null,
      //             });
      //           });

      //           resolve(products);
      //         }
      //       }, 3000);
      //     });
      //   });
      // };

      const scrapeProducts = async () => {
        await page2.waitForSelector(".products-list .product-card", {
          timeout: 720000,
        });
        const products = await page2.evaluate(() => {
          const productElements = document.querySelectorAll(".product-card");
          const productList = [];

          productElements.forEach((e) => {
            productList.push({
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
              image: e.querySelector(".image-wrapper img").getAttribute("src"),
              product_info: null,
            });
          });

          return productList;
        });

        return products;
      };

      let currentPage = 1;

      let allProducts = [];

      const scrapePagesRecursively = async () => {
        let empty_result = await page2.evaluate(() => {
          const element = document.querySelector(".pagination-wrapper");
          if (element) {
            const element_style =
              window.getComputedStyle(element).display === "none"
                ? false
                : true;
            return element_style;
          }

          return null;
        });

        console.log(empty_result);
        if (empty_result) {
          const productsOnPage = await scrapeProducts();
          allProducts = allProducts.concat(productsOnPage);

          currentPage++;
          await page2.goto(
            `${children_categories[index].url}?currentPage=${currentPage}`,
            {
              waitUntil: "load",
              timeout: 720000,
            }
          );

          await page2.waitForSelector(".products-list .product-card", {
            timeout: 720000,
          });
          await scrapePagesRecursively();
        } else currentPage = 1;
      };

      await scrapePagesRecursively();

      console.log(allProducts.length);

      let boxes = allProducts;

      for (let box = 0; box < boxes.length; box++) {
        console.log(box, "-product");
        const page3 = await browser.newPage();

        const customUA = generateRandomUA();

        await page3.setUserAgent(customUA);

        await page3.setViewport({
          width: 1024,
          height: 768,
        });

        await page3.goto(boxes[box].url, {
          waitUntil: "load",
          timeout: 720000,
        });

        const cloudflare = await page3.evaluate(() => {
          const element = document.querySelector(".indent-from-header");
          if (element) {
            return true;
          }
          return false;
        });

        if (cloudflare) {
          // await page3.waitForSelector(".product-info-card", {
          //   timeout: 720000,
          // });
          // await page3.close();

          const response = await page3.evaluate(async () => {
            const url = window.location.pathname.split("-");
            const product_id = url[url.length - 1];

            if (product_id) {
              try {
                const response = await fetch(
                  `https://api.uzum.uz/api/v2/product/${product_id}`,
                  {
                    method: "GET",
                    mode: "cors",
                    cache: "no-cache",
                    credentials: "same-origin",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    redirect: "follow",
                    referrerPolicy: "no-referrer",
                  }
                );
                return response.json();
              } catch (err) {
                console.log(err);
              }
            }
            return null;
          });

          boxes[box].product_info = response?.payload?.data || {};

          await saveProduct(boxes[box]);

          await page3.close();
        } else await page3.close();
        // await page3.waitForTimeout(2000); // 2 second
      }

      children_categories[index].products = boxes;

      console.log(children_categories.length, "all children categories");

      // await page2.waitForTimeout(5000); // 2 second
      await page2.close();
    } else await page2.close();
  }

  await page.screenshot({ path: "step2.png" });

  await page.close();

  await browser.close();
};

module.exports = scrapingProducts();
