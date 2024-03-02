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
const generateRandomUA = () => {
  // Array of random user agents
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
  ];
  // Get a random index based on the length of the user agents array
  const randomUAIndex = Math.floor(Math.random() * userAgents.length);
  // Return a random user agent using the index above
  return userAgents[randomUAIndex];
};

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1024,768`],
  });

  // Open a new blank page
  const page = await browser.newPage();

  // Custom user agent from generateRandomUA() function
  const customUA = generateRandomUA();

  // Set custom user agent
  await page.setUserAgent(customUA);

  await page.setViewport({
    width: 1024,
    height: 768,
  });

  // Navigate the page to target website
  await page.goto("https://uzum.uz/ru/category/stacionarnye-telefony-13733", {
    waitUntil: "load",
  });

  // Get the text content of the page's body
  const content = await page.evaluate(() => document.body.innerHTML);

  //   .non-extendable-offer .products .card

  await page.waitForSelector(".products-list .product-card", {
    timeout: 50000,
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

  const getData = () => {
    return page.evaluate(async () => {
      return await new Promise((resolve) => {
        const element = document.querySelector(".button-more");
        // return window.getComputedStyle(element).display;
        let products = [];
        let interval = setInterval(() => {
          if (window.getComputedStyle(element).display === "inline-flex") {
            element.click();
          } else {
            clearInterval(interval);
            // setTimeout(() => {
            let elements = document.querySelectorAll(".product-card");

            elements.forEach((e) => {
              products.push({
                title: e.querySelector(".card-info-block .subtitle a")
                  .innerHTML,
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

            // let products = elements.map((e) => ({
            //   title: e.querySelector(".card-info-block .subtitle a").innerHTML,
            //   price: Number(
            //     e
            //       .querySelector(
            //         ".card-info-block .product-card-main-info-wrapper .product-card-price"
            //       )
            //       .innerHTML.replace(/\D/g, "")
            //   ),
            //   url: e.querySelector(".card-info-block .subtitle a").href,
            //   image: e.querySelector(".image-wrapper img").getAttribute("src"),
            // }));

            // products.then((res) => {
            //   fs.writeFile("courses.json", JSON.stringify(res), (err) => {
            //     if (err) throw err;
            //     console.log(res);
            //     // page.close();

            //     // browser.close();
            //   });
            // });
            // }, 3000);
          }
        }, 3000);
      });
    });
  };

  let boxes = await getData();

  fs.writeFile("courses.json", JSON.stringify(boxes), (err) => {
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