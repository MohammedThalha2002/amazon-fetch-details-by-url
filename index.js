const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
var bodyParser = require("body-parser");

const app = express();

const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  console.log("GET REQ");
  res.send("GETTING REQUEST SUCCESSFULLY");
});

app.post("/", async (req, res) => {
  const url = req.body.url;
  const result = await scrape(url);
  res.send(result);
});

const scrape = async (url) => {
  let data = {};
  try {
    await getHTML(url).then(async (html) => {
      const $ = cheerio.load(html);
      let title = $("#productTitle").text();
      if (title.length > 100) {
        if (title.includes(",")) {
          title = title.split(",")[0];
        } else {
          title = title.substring(0, 90) + "...";
        }
      }
      let features = [];
      $("#feature-bullets>ul>li").each((i, desc) => {
        if (i < 2) {
          features.push(
            $(desc)
              .text()
              .trim()
              .replace(/[|\&;$%@"<>()+,]/g, "")
          );
        }
      });
      let imgUrl = $("#imgTagWrapperId>img").attr("src");
      let curr_price = $(".a-price-whole").text();
      curr_price = curr_price.replace(/,/g, "");
      curr_price = parseInt(curr_price);
      let inStock = $("#availability>span").text().trim();
      let rating = $("#acrPopover>span>a>span").text().trim();

      data = {
        status: "success",
        url: url,
        title: title.trim().replace(/[|\&;$%@"<>()+,]/g, ""),
        features: features,
        imgUrl: imgUrl,
        inStock:
          inStock.includes("Out") || inStock.includes("OUT") ? false : true,
        rating: parseFloat(rating),
        curr_price: curr_price,
      };
    });
  } catch (error) {
    console.log(error);
    data = {
      status: "success",
      url: url,
      title: "Updating...",
      features: ["Updating...", "Updating..."],
      imgUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/310px-Placeholder_view_vector.svg.png",
      inStock: true,
      rating: 0.0,
      curr_price: 0.0,
    };
    console.log("Failed to fetch the url data");
    console.log(data);
  }
  return data;
};

const getHTML = async (url) => {
  const { data: html } = await axios.get(url);
  return html;
};

app.listen(PORT, () => {
  console.log(`Listening to the PORT : ` + PORT);
});
