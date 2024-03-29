// let puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
//   const page = await browser.newPage();
//   await page.goto("https://uzum.uz/ru");

//   // let's make a screenshot to debug if the page looks good
//   await page.screenshot({ path: "step1.png" });

//   // now make sure the search input is there on the page.
//   await page.waitForSelector(".subtitle-item");

//   await page.screenshot({ path: "step2.png" });
//   await browser.close();
// })();

const fs = require("fs");
const puppeteer = require("puppeteer");
const user_agents = require("./user-agents.json");
require("dotenv").config();

const generateRandomUA = () => {
  // Array of random user agents
  const userAgents = user_agents;
  // Get a random index based on the length of the user agents array
  const randomUAIndex = Math.floor(Math.random() * userAgents.length);
  // Return a random user agent using the index above
  return userAgents[randomUAIndex];
};

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--window-size=1024,768`,
      // `--proxy-server=http://38.154.227.167:5868`,
      // "--no-sandbox",
      // "--disable-setuid-sandbox",
    ],
    protocolTimeout: 24000000,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  // Open a new blank page
  const page = await browser.newPage();

  // Custom user agent from generateRandomUA() function
  const customUA = generateRandomUA();

  // Set custom user agent
  await page.setUserAgent(customUA);

  // page.setExtraHTTPHeaders

  await page.setViewport({
    width: 1024,
    height: 768,
  });

  // Navigate the page to target website
  await page.goto(
    "https://uzum.uz/ru/category/aksessuary-dlya-smartfonov-10398",
    {
      waitUntil: "load",
      timeout: 180000,
    }
  );

  // Get the text content of the page's body
  const content = await page.evaluate(() => document.body.innerHTML);

  //   .non-extendable-offer .products .card

  await page.waitForSelector(".products-list .product-card", {
    timeout: 180000,
  });

  // let interval = setInterval(() => {
  //   const button_more = page.evaluate(() => {
  //     const element = document.querySelector(".button-more");
  //     // return window.getComputedStyle(element).display;
  //     if (window.getComputedStyle(element).display === "inline-flex") {
  //       element.click();
  //     } else {
  //       clearInterval(interval);
  //       setTimeout(() => {
  //         let products = page.$$eval(".product-card", (elements) =>
  //           elements.map((e) => ({
  //             title: e.querySelector(".card-info-block .subtitle a").innerHTML,
  //             price: Number(
  //               e
  //                 .querySelector(
  //                   ".card-info-block .product-card-main-info-wrapper .product-card-price"
  //                 )
  //                 .innerHTML.replace(/\D/g, "")
  //             ),
  //             url: e.querySelector(".card-info-block .subtitle a").href,
  //             image: e.querySelector(".image-wrapper img").getAttribute("src"),
  //           }))
  //         );

  //         products.then((res) => {
  //           fs.writeFile("courses.json", JSON.stringify(res), (err) => {
  //             if (err) throw err;
  //             console.log(res);
  //             page.close();

  //             browser.close();
  //           });
  //         });
  //       }, 3000);
  //     }
  //   });

  //   button_more.then((e) => {
  //     console.log(e);
  //   });
  // }, 3000);

  // const getData = () => {
  //   return page.evaluate(async () => {
  //     return await new Promise((resolve) => {
  //       const element = document.querySelector(".button-more");
  //       // return window.getComputedStyle(element).display;
  //       let products = [];
  //       let interval = setInterval(() => {
  //         if (window.getComputedStyle(element).display === "inline-flex") {
  //           element.click();
  //         } else {
  //           clearInterval(interval);
  //           setTimeout(() => {
  //             let elements = document.querySelectorAll(".product-card");

  //             elements.forEach((e) => {
  //               products.push({
  //                 title: e
  //                   .querySelector(".card-info-block .subtitle a")
  //                   .innerHTML.trim(),
  //                 price: Number(
  //                   e
  //                     .querySelector(
  //                       ".card-info-block .product-card-main-info-wrapper .product-card-price"
  //                     )
  //                     .innerHTML.replace(/\D/g, "")
  //                 ),
  //                 url: e.querySelector(".card-info-block .subtitle a").href,
  //                 image: e
  //                   .querySelector(".image-wrapper img")
  //                   .getAttribute("src"),
  //                 product_info: null,
  //               });
  //             });

  //             resolve(products);

  //             // let products = elements.map((e) => ({
  //             //   title: e.querySelector(".card-info-block .subtitle a").innerHTML,
  //             //   price: Number(
  //             //     e
  //             //       .querySelector(
  //             //         ".card-info-block .product-card-main-info-wrapper .product-card-price"
  //             //       )
  //             //       .innerHTML.replace(/\D/g, "")
  //             //   ),
  //             //   url: e.querySelector(".card-info-block .subtitle a").href,
  //             //   image: e.querySelector(".image-wrapper img").getAttribute("src"),
  //             // }));

  //             // products.then((res) => {
  //             //   fs.writeFile("courses.json", JSON.stringify(res), (err) => {
  //             //     if (err) throw err;
  //             //     console.log(res);
  //             //     // page.close();

  //             //     // browser.close();
  //             //   });
  //             // });
  //           }, 3000);
  //         }
  //       }, 3000);
  //     });
  //   });
  // };

  const scrapeProducts = async () => {
    await page.waitForSelector(".products-list .product-card", {
      timeout: 180000,
    });
    const products = await page.evaluate(() => {
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
    let empty_result = await page.evaluate(() => {
      const element = document.querySelector(".pagination-wrapper .pagination");
      if (element) {
        return element;
      }

      return null;
    });

    console.log(true, empty_result);
    if (empty_result) {
      const productsOnPage = await scrapeProducts();
      allProducts = allProducts.concat(productsOnPage);

      currentPage++;
      await page.goto(
        "https://uzum.uz/ru/category/aksessuary-dlya-smartfonov-10398?currentPage=" +
          currentPage,
        {
          waitUntil: "load",
          timeout: 180000,
        }
      );

      await page.waitForSelector(".products-list .product-card", {
        timeout: 180000,
      });
      await scrapePagesRecursively();
    } else {
      currentPage = 1;
    }
  };

  await scrapePagesRecursively();

  console.log(allProducts.length);

  console.log(currentPage);

  let boxes = allProducts;

  for (let index = 0; index < boxes.length; index++) {
    const page2 = await browser.newPage();

    const customUA = generateRandomUA();

    await page2.setUserAgent(customUA);

    await page2.setViewport({
      width: 1024,
      height: 768,
    });

    // Navigate the page to target website
    await page2.goto(boxes[index].url, { waitUntil: "load", timeout: 180000 });

    const cloudflare = await page2.evaluate(() => {
      const element = document.querySelector(".indent-from-header");
      if (element) {
        return true;
      }
      return false;
    });

    if (cloudflare) {
      // await page2.waitForSelector(".product-info-card", {
      //   timeout: 180000,
      // });
      // await page2.close();

      const response = await page2.evaluate(async () => {
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

      boxes[index].product_info = response?.payload?.data || null;

      await page2.close();
    } else await page2.close();
  }

  await fs.writeFile("courses.json", JSON.stringify(boxes), (err) => {
    if (err) throw err;
    console.log("File saved", boxes);
  });

  // const products = await page.$$eval(".product-card", (elements) =>
  //   elements.map((e) => ({
  //     title: e.querySelector(".card-info-block .subtitle a").innerHTML,
  //     price: e.querySelector(
  //       ".card-info-block .product-card-main-info-wrapper .product-card-price"
  //     ).innerHTML,
  //     url: e.querySelector(".card-info-block .subtitle a").href,
  //   }))
  // );

  // console.log(products);

  //   page.evaluate(() => {
  //     window.scrollBy(0, window.innerHeight);
  //   });

  await page.screenshot({ path: "step1.png" });

  // Log the text content
  //   console.log(content);

  // Close the page
  // await page.close();

  // const page2 = await browser.newPage();

  // await page2.goto("https://api.uzum.uz/api/v2/product/589093", {
  //   waitUntil: "networkidle2",
  // });

  // const data = await page2.evaluate(() => document.body.innerText);

  // fs.writeFile("courses.json", data, (err) => {
  //   if (err) throw err;
  //   console.log("File saved");
  // });

  // await page2.close();

  // Close the browser
  // await browser.close();

  await page.close();
  await browser.close();
})();
