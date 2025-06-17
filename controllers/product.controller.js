import mongoose from "mongoose";
import Product from "../models/product.model.js";
import stat from "../models/stat.model.js";
import User from "../models/users.model.js";
import request from "request";
import { createTransport } from "nodemailer";
import * as bcrypt from "bcrypt";
import pkg from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const { sign, verify } = pkg;
const key = process.env.key;
const jwtkey = process.env.jwtkey;
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googletoken = process.env.googleToken;
export const searchStock = async (req, res) => {
  const { id } = req.params;
  try {
    request(
      {
        url:
          `https://indian-stock-exchange-api2.p.rapidapi.com/stock?name=` + id,
        headers: {
          "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      },
      function (error, response, body) {
        console.error("error:", error); // Print the error if one occurred
        let product = JSON.parse(body);
        let {
          companyName,
          industry,
          companyProfile,
          currentPrice,
          yearHigh,
          yearLow,
          recosBar,
          recentNews,
          stockDetailsReusableData,
        } = product;
        let newProduct = {
          companyName,
          industry,
          companyProfile,
          currentPrice,
          yearHigh,
          yearLow,
          recosBar,
          recentNews,
          stockDetailsReusableData,
        };

        res.status(200).json({ success: true, data: newProduct });
      }
    );
    //const products = await Product.find({});
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const signUp = async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = await User.create({
    username: req.body.username,
    password: hashedPassword,
    email: req.body.email,
  });

  return res.status(200).json(user);
};

export const login = async (req, res) => {
  try {
    const { credential } = req.body; // Google token sent from client

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googletoken,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId, name, picture } = payload;

    // Try to find user by email
    let user = await User.findOne({ email });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        email,
        userid: googleId,
        username: name,
      });

      const stats = await stat.create({
        stat: {
          strongbuy: 0,
          buy: 0,
          sell: 0,
          strongsell: 0,
          hold: 0,
        },
        userid: googleId,
      });
    }

    const token = sign({ user: user }, jwtkey, {
      expiresIn: "1d",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // send over HTTPS only in prod
        sameSite: "Lax", // or "Strict" depending on your case
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(200)
      .json({ token });
  } catch (error) {
    console.error("Google login error", error);
    res.status(401).json({ error: "Google login failed" });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.body;

  if (!token)
    return res.status(401).json({ success: false, data: "Access denied" });
  try {
    const decoded = verify(token, jwtkey);
    req.userId = decoded.userId;
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    res.status(401).json({ success: false, data: "Access denied" });
  }
};
export const authenticateUser = async (token) => {
  try {
    if (!token) return { error: "Unauthorized" };

    const decoded = verify(token, jwtkey);
    const user = await User.findOne({ email: decoded.user.email });
    if (!user) return { error: "User not found" };

    return user;
  } catch (error) {
    return { error: "Invalid or expired token" };
  }
};
export const getReccomended = async (req, res) => {
  try {
    request(
      {
        url: `https://indian-stock-exchange-api2.p.rapidapi.com/trending`,
        headers: {
          "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      },
      function (error, response, body) {
        console.error("error:", error); // Print the error if one occurred

        res.status(200).json({ success: true, data: JSON.parse(body) });
      }
    );
    //const products = await Product.find({});
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getProducts = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Then verify token and continue

  const user = await authenticateUser(token);

  try {
    const products = await Product.find({ userid: user.userid });
    res.status(201).json({ success: true, data: products });
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getMutalfunds = async (req, res) => {
  const { id } = req.params;
  try {
    request(
      {
        url: `https://indian-stock-exchange-api2.p.rapidapi.com/mutual_funds`,
        headers: {
          "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      },
      function (error, response, body) {
        console.error("error:", error); // Print the error if one occurred

        res.status(200).json({ success: true, data: body });
      }
    );
    //const products = await Product.find({});
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getIpo = async (req, res) => {
  console.log("called");
  const { id } = req.params;
  try {
    request(
      {
        url: `https://indian-stock-exchange-api2.p.rapidapi.com/ipo`,
        headers: {
          "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      },
      function (error, response, body) {
        console.error("error:", error); // Print the error if one occurred
        res.status(200).json({ success: true, data: body });
      }
    );
    //const products = await Product.find({});
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getHistoricalData = async (req, res) => {
  const { id } = req.params;
  const myarr = id.split("-");
  try {
    request(
      {
        url:
          `https://indian-stock-exchange-api2.p.rapidapi.com/historical_data?stock_name=` +
          myarr[0] +
          `&period=` +
          myarr[1] +
          `&filter=price`,
        headers: {
          "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
      },
      function (error, response, body) {
        console.error("error:", error); // Print the error if one occurred

        res.status(200).json({ success: true, data: body });
      }
    );
    //const products = await Product.find({});
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const createProduct = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Then verify token and continue

  const user = await authenticateUser(token);
  if (!user && !user.userid) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
  const product = req.body; // user will send this data
  const newProduct = new Product({ product: product, userid: user.userid });

  try {
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("Error in Create product:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getStat = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    // Then verify token and continue

    const user = await authenticateUser(token);
    if (!user && !user.userid) {
      return res.status(500).json({ success: false, message: "Server Error" });
    }
    const products = await stat.find({ userid: user.userid });
    res.status(201).json({ success: true, data: products });
  } catch (error) {
    console.log("error in fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
const mailing = async (user) => {
  const products3 = await Product.find({ userid: user.userid });
  var transporter = createTransport({
    service: "gmail",
    auth: {
      user: "temp1sanman014@gmail.com",
      pass: "euwc alvn niwf nwzj",
    },
  });
  const stats = await stat.find({ userid: user.userid });
  const getColour = (value) => {
    if (value >= 0 && value <= 1) {
      return `
            <span style="color:#02552E">&#9675;</span>
         <span class="status-text "> Strong Buy</span>
       `;
    }
    if (value > 1 && value <= 2) {
      return `
            <span style="color:#06AA5A">&#9675;</span>
         <span class="status-text "> Buy</span>
       `;
    }
    if (value > 2 && value <= 3) {
      return `
            <span style="color:#898989">&#9675;</span>
         <span class="status-text "> Hold</span>
       `;
    }
    if (value > 3 && value <= 4) {
      return `
            <span style="color:#FF0000">&#9675;</span>
         <span class="status-text "> Sell</span>
       `;
    }
    if (value > 4 && value <= 5) {
      return `
            <span style="color:#B40000">&#9675;</span>
         <span class="status-text "> Strong Sell</span>
       `;
    }
  };

  var mailOptions = {
    from: "temp1sanman014@gmail.com",
    to: user.email,
    subject: " Your watchlist Summary report - " + new Date().toISOString(),
    html:
      `<!DOCTYPE html>
<html>
<head>
<title>[CodePen Spark] Tab Details, Cool :has() Tricks, and a Skating Bunny</title>
<link rel="important stylesheet" href="chrome://messagebody/skin/messageBody.css">
</head>
<body>
<br>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
    Your summary report
  </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; ">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
   @import "https://s3-us-west-2.amazonaws.com/s.cdpn.io/584938/dashboard.scss";
 body {
	 background-color: #1b2431;
	 color: #202020;
	 font-family: "Montserrat", "Helvetica", "Open Sans", "Arial";
	 font-size: 13px;
}
 a:hover {
	 text-decoration: none;
}
 p, figure {
	 margin: 0;
	 padding: 0;
}
 .navbar {
	 background-color: #1b2431;
}
 .sidebar {
	 background-color: #1b2431;
	 box-shadow: none;
}
 .sidebar .nav-link {
	 border-left: 5px solid transparent;
	 color: #738297;
	 padding: 0.5rem 0.75rem;
}
 .sidebar .nav-link:hover {
	 color: white;
}
 .sidebar .nav-link.active {
	 border-left: 5px solid #738297;
	 color: white;
}
 .sidebar .zmdi {
	 display: inline-block;
	 font-size: 1.35rem;
	 margin-right: 5px;
	 min-width: 25px;
}
 .card-list {
	 width: 100%;
}
 .card-list:before, .card-list:after {
	 content: " ";
	 display: table;
}
 .card-list:after {
	 clear: both;
}
 .card {
	 border-radius: 8px;
	 color: white;
	 padding: 10px;
	 position: relative;
}
 .card-list .row1 {
        display: flex;
        justify-content: space-around;
        margin-bottom: 40px;
        margin-top: 40px;
}
 .card .zmdi {
	 color: white;
	 font-size: 28px;
	 opacity: 0.3;
	 position: absolute;
	 right: 13px;
	 top: 13px;
}
 .card .stat {
	 border-top: 1px solid rgba(255, 255, 255, 0.3);
	 font-size: 8px;
	 margin-top: 25px;
	 padding: 10px 10px 0;
	 text-transform: uppercase;
}
 .card .title {
	 display: inline-block;
	 font-size: 8px;
	 padding: 10px 10px 0;
	 text-transform: uppercase;
}
 .card .value {
	 font-size: 12px;
	 padding: 0 10px;
}
 .card.blue {
	 background-color: #2298f1;
}
 .card.yellow {
	 background-color: grey;
}
 .card.green {
	 background-color: #66b92e;
}
 .card.orange {
	 background-color: #da932c;
}
 .card.red {
	 background-color: #d65b4a;
}
 .projects {
	 background-color: #273142;
	 border: 1px solid #313d4f;
	 overflow-x: auto;
	 width: 100%;
}
 .projects-inner {
	 border-radius: 4px;
}
 .projects-header {
	 color: white;
	 padding: 22px;
}
 .projects-header .count, .projects-header .title {
	 display: inline-block;
}
 .projects-header .count {
	 color: #738297;
}
 .projects-header .zmdi {
	 cursor: pointer;
	 float: right;
	 font-size: 16px;
	 margin: 5px 0;
}
 .projects-header .title {
	 font-size: 21px;
}
 .projects-header .title + .count {
	 margin-left: 5px;
}
 .projects-table {
	 background: #273142;
	 width: 100%;
}
 .projects-table td, .projects-table th {
	 color: white;
	 padding: 10px 22px;
	 vertical-align: middle;
}
 .projects-table td p {
	 font-size: 12px;
}
 .projects-table td p:last-of-type {
	 color: #738297;
	 font-size: 11px;
}
 .projects-table th {
	 background-color: #313d4f;
}
 .projects-table tr:hover {
	 background-color: #303d52;
}
 .projects-table tr:not(:last-of-type) {
	 border-bottom: 1px solid #313d4f;
}
 .projects-table .member figure, .projects-table .member .member-info {
	 display: inline-block;
	 vertical-align: top;
}
 .projects-table .member figure + .member-info {
	 margin-left: 7px;
}
 .projects-table .member img {
	 border-radius: 50%;
	 height: 32px;
	 width: 32px;
}
 .projects-table .status > form {
	 float: right;
}
 .projects-table .status-text {
	 display: inline-block;
	 font-size: 12px;
	 margin: 11px 0;
	 padding-left: 20px;
	 position: relative;
}
 .projects-table .status-text:before {
	 border: 3px solid;
	 border-radius: 50%;
	 content: "";
	 height: 14px;
	 left: 0;
	 position: absolute;
	 top: 1px;
	 width: 14px;
}
 .projects-table .status-text.status-blue:before {
	 border-color: #1c93ed;
}
 .projects-table .status-text.status-green:before {
	 border-color: #66b92e;
}
 .projects-table .status-text.status-orange:before {
	 border-color: #da932c;
}
 .projects-table .status-text.status-red:before {
	 border-color: #d65b4a;
}
 .selectric {
	 background-color: transparent;
	 border-color: #313d4f;
	 border-radius: 4px;
}
 .selectric .label {
	 color: #738297;
	 line-height: 34px;
	 margin-right: 10px;
	 text-align: left;
}
 .selectric-wrapper {
	 float: right;
	 width: 150px;
}
 .chart {
	 border-radius: 3px;
	 border: 1px solid #313d4f;
	 color: white;
	 padding: 10px;
	 position: relative;
	 text-align: center;
}
 .chart canvas {
	 height: 400px;
	 margin: 20px 0;
	 width: 100%;
}
 .chart .actions {
	 margin: 15px;
	 position: absolute;
	 right: 0;
	 top: 0;
}
 .chart .actions span {
	 cursor: pointer;
	 display: inline-block;
	 font-size: 20px;
	 margin: 5px;
	 padding: 4px;
}
 .chart .actions .btn-link {
	 color: white;
}
 .chart .actions .btn-link i {
	 font-size: 1.75rem;
}
 .chart .title {
	 font-size: 18px;
	 margin: 0;
	 padding: 15px 0 5px;
}
 .chart .title + .tagline {
	 margin-top: 10px;
}
 .chart .tagline {
	 font-size: 12px;
}
 .danger-item {
	 border-left: 4px solid #a84d43;
}
 .zmdi {
	 line-height: 1;
	 vertical-align: middle;
}

 

  </style>
  <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
  <!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]-->
  <!--[if !mso]><!-->
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css?family=Lato:300,400,500,700);

  </style>
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }

      .mj-column-per-50 {
        width: 50% !important;
        max-width: 50%;
      }
    }

  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }

    .moz-text-html .mj-column-per-50 {
      width: 50% !important;
      max-width: 50%;
    }

  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }

  </style>
  <style type="text/css">
    @media screen {
      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 400;
        src: local('Lato Regular'), local('Lato-Regular'),
          url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 700;
        src: local('Lato Bold'), local('Lato-Bold'),
          url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: italic;
        font-weight: 400;
        src: local('Lato Italic'), local('Lato-Italic'),
          url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 900;
        src: local('Lato Black'), local('Lato-Black'),
          url(https://fonts.gstatic.com/s/lato/v14/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2) format('woff2');
      }
    }

    body {
      font-family: Lato, 'Lucida Grande', 'Lucida Sans Unicode', Tahoma, sans-serif;
      font-size: 18px;
      line-height: 1.5;
      color: #e3e4e8;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    p,
    li {
      color: #e3e4e8;
      line-height: 1.5;
      font-size: 18px;
      margin: 0 0 15px 0;
    }

    li {
      margin-bottom: 10px;
    }

    blockquote {
      background: none;
      border-left: 1px solid gray;
      padding-left: 10px;
      margin: 0 0 15px 10px;
    }

    h1,
    h2,
    h3 {
      color: white;
    }

    h1 {
      font-size: 28px;
      margin: 0 0 15px 0;
      line-height: 1.2;
    }

    h2 {
      font-size: 26px;
      margin: 0;
      line-height: 1.2;
    }

    h3 {
      font-size: 24px;
      margin: 20px 0 10px 0;
      line-height: 1.2;
    }

    .news-content a,
    .spark-item a,
    .subscription-details a,
    .pro-content a {
      text-decoration: none;
      color: #76adff;
    }

    pre {
      white-space: pre-wrap;
      line-height: 1.8;
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    }

    .view-on-web-link {
      color: #74c5ff;
      text-transform: uppercase;
      display: block;
      padding: 5px 10px;
      background: #383b43;
      width: 66%;
      margin: 0 auto;
      clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
      text-decoration: none;
    }

    .dedicated-hero-area-copy {
      padding: 20px;
    }

    .dedicated-hero-area-copy h2 {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      text-align: center;
      margin: 0 0 20px 0;
      font-size: 32px;
      line-height: 1.2;
    }
    .dedicated-hero-area-copy h3 {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      text-align: center;
      margin: 0 0 20px 0;
      font-size: 26px;
      line-height: 1.2;
    }

    .spark-item {
      margin-bottom: 50px;
    }

    .spark-item[data-type='sponsor'] .spark-item-type {
      color: #fedd41;
    }

    .spark-item-type {
      color: #99a3bc;
      padding-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 10px;
    }

    .spark-title {
      font-weight: bold;
      color: #505050;
      padding: 5px 0 5px 0;
      font-size: 20px;
      line-height: 1.2;
    }

    .spark-desc {
      padding-top: 4px;
      color: #cccfdc;
      font-size: 15px;
      line-height: 1.4;
    }

    .spark-thumb {
      border: 0;
      display: block;
      height: auto;
      max-width: 100%;
      outline: none;
      text-decoration: none;
      margin: 0 0 10px 0;
    }
    
    .fem-callout {
      background: #dd7932;
      color: white;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 60px;
      line-height: 1.4;
    }
    .fem-callout p {
      font-size: 14px;
    }
    .fem-callout a {
      color: #fffd00;
    }
    .fem-callout h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    .news-header {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      margin: 0 0 5px 0;
      font-size: 36px;
      text-align: left;
      color: white;
    }

    .news-bar {
      height: 5px;
      border-radius: 100px;
      background: white;
      background: linear-gradient(92.63deg,
          #769aff 8.23%,
          #ffdd40 25.83%,
          #f19994 51.91%,
          #47cf73 68.56%);
      width: 70%;
      margin: 0 0 10px 0;
    }

    .pro-bar {
      height: 5px;
      border-radius: 100px;
      background: #ffdb00;
      width: 70%;
      margin: 0 0 10px 0;
    }

    .pro-header {
      text-align: left;
    }

    .pro-header a {
      color: #ffdb00;
      text-decoration: none;
    }

    .footer-bar {
      height: 10px;
      background: linear-gradient(92.63deg,
          #769aff 8.23%,
          #ffdd40 25.83%,
          #f19994 51.91%,
          #47cf73 68.56%);
    }

    @media only screen and (max-width: 400px) {
      h1 {
        font-size: 22px;
      }

      p {
        font-size: 14px;
      }

      .spark-thumb {
        display: block;
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
    }

  </style>
</head>

<body style="word-spacing:normal;background-color:#1c1d22;">
<nav class="navbar navbar-dark sticky-top flex-md-nowrap p-0">
	<a  style="color:white;font-size:12px;padding:10px" class="navbar-brand col-sm-3 col-md-2 mr-0" href="#">Link to the dashboard</a>

	
</nav>
<div class="container-fluid">
	<div >
	
		<main role="main" >
			<div class="card-list" >
				
					<div  style="display: flex;justify-content:space-around;padding:30px;margin-top:40px;" >
				   <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card blue">
							<div class="title">Strong Buy</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.strongbuy}</div>
							<div class="stat"><b>${Math.round(
                100 *
                  (stats[0].stat.strongbuy /
                    (stats[0].stat.buy +
                      stats[0].stat.hold +
                      stats[0].stat.sell +
                      stats[0].stat.strongsell))
              )}</b>% 
						   </div>
					</div>
          </div>
         
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card green">
							<div class="title">Buy</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.buy}</div>
							<div class="stat"><b>${Math.round(
                100 *
                  (stats[0].stat.buy /
                    (stats[0].stat.buy +
                      stats[0].stat.hold +
                      stats[0].stat.sell +
                      stats[0].stat.strongsell))
              )}</b>% </div>
						</div>
						</div>
					
          <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card yellow">
							<div class="title">Hold</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.hold}</div>
							<div class="stat"><b>${Math.round(
                100 *
                  (stats[0].stat.hold /
                    (stats[0].stat.buy +
                      stats[0].stat.hold +
                      stats[0].stat.sell +
                      stats[0].stat.strongsell))
              )}</b>% </div>
						</div>
					</div>
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card orange">
							<div class="title">Sell</div>
							<i class="zmdi zmdi-download"></i>
							<div class="value">${stats[0].stat.sell}</div>
							<div class="stat"><b>${Math.round(
                100 *
                  (stats[0].stat.sell /
                    (stats[0].stat.buy +
                      stats[0].stat.hold +
                      stats[0].stat.sell +
                      stats[0].stat.strongsell))
              )}</b>% </div>
						</div>
					</div>
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card red">
							<div class="title">Strong sell</div>
							<i class="zmdi zmdi-download"></i>
								<div class="value">${stats[0].stat.strongsell}</div>
							<div class="stat"><b>${Math.round(
                100 *
                  (stats[0].stat.strongsell /
                    (stats[0].stat.buy +
                      stats[0].stat.hold +
                      stats[0].stat.sell +
                      stats[0].stat.strongsell))
              )}</b>% </div>
						</div>
					</div>
				</div>
			</div>
			<div class="projects mb-4">
				<div class="projects-inner">
					<header class="projects-header">
						<div class="title">Current list</div>
						<div class="count">| ${products3.length} Stocks</div>
						<i class="zmdi zmdi-download"></i>
					</header>
					<table class="projects-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Price NSE</th>
                <th>Price BSE</th>
								<th>Percent change </th>
								<th>Recomendation</th>
								
							</tr>
						</thead>
            ` +
      products3.map((obj) => {
        return `	<tr>
							<td>
								<p>${obj.product.companyName}</p>
								<p style="color: #738297;
    font-size: 11px;">${obj.product.companyProfile.exchangeCodeNse}</p>
							</td>
							<td>
								<p>${obj.product.currentPrice.NSE}</p>
							
							</td>
              	<td>
								<p>${obj.product.currentPrice.BSE}</p>
								
							</td>
							<td class="member">
								<figure>
                <p>
                ${
                  parseFloat(
                    obj.product.stockDetailsReusableData.percentChange
                  ) > 0
                    ? "↑"
                    : "↓"
                }
                </p>
                </figure>
								<div class="member-info">
									<p>${obj.product.stockDetailsReusableData.percentChange}</p>
								
								</div>
							</td>
						
							<td class="status">
              ${getColour(obj.product.recosBar.meanValue)}
							</td>
							
						</tr>
						`;
      }) +
      `
					
					</table>
				</div>
			</div>
		
		</main>
	</div>
</div>
</body>

</html>

</body>
</html>
</table></div>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return error;
    } else {
      return "Success";
    }
  });
};
export const updateStat = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Then verify token and continue

  const user = await authenticateUser(token);
  if (!user && !user.userid) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }

  //update stat

  let stats = {
    stat: {
      strongbuy: 0,
      buy: 0,
      sell: 0,
      strongsell: 0,
      hold: 0,
    },
    userid: user.userid,
  };
  const products1 = await Product.find({ userid: user.userid });
  let products = [
    {
      product: {
        recosBar: {
          meanValue: 0,
        },
      },
    },
  ];
  products = products1;
  products1.map((obj) => {
    if (
      obj.product.recosBar.meanValue >= 0 &&
      obj.product.recosBar.meanValue <= 1
    ) {
      stats.stat.strongbuy += 1;
    }
    if (
      obj.product.recosBar.meanValue > 1 &&
      obj.product.recosBar.meanValue <= 2
    ) {
      stats.stat.buy += 1;
    }
    if (
      obj.product.recosBar.meanValue > 2 &&
      obj.product.recosBar.meanValue <= 3
    ) {
      stats.stat.hold += 1;
    }
    if (
      obj.product.recosBar.meanValue > 3 &&
      obj.product.recosBar.meanValue <= 4
    ) {
      stats.stat.sell += 1;
    }
    if (
      obj.product.recosBar.meanValue > 4 &&
      obj.product.recosBar.meanValue <= 5
    ) {
      stats.stat.strongsell += 1;
    }
  });

  try {
    const updatedProduct = await stat.findOneAndUpdate(
      { userid: user.userid },
      stats,
      {
        new: true,
      }
    );
    //const final = mailing();
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const updateProduct = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Then verify token and continue

  const user = await authenticateUser(token);
  if (!user && !user.userid) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }

  //update products
  const products3 = await Product.find({ userid: user.userid });

  products3.map((obj) => {
    try {
      request(
        {
          url:
            `https://indian-stock-exchange-api2.p.rapidapi.com/stock?name=` +
            obj.product.companyName,
          headers: {
            "x-rapidapi-host": "indian-stock-exchange-api2.p.rapidapi.com",
            "x-rapidapi-key": key,
          },
        },
        async function (error, response, body) {
          console.error("error:", error); // Print the error if one occurred
          let product = JSON.parse(body);
          let {
            companyName,
            industry,
            companyProfile,
            currentPrice,
            yearHigh,
            yearLow,
            recosBar,
            recentNews,
            stockDetailsReusableData,
          } = product;
          let newProduct = {
            product: {
              companyName,
              industry,
              companyProfile,
              currentPrice,
              yearHigh,
              yearLow,
              recosBar,
              recentNews,
              stockDetailsReusableData,
            },
          };

          const updatedProduct = await Product.findByIdAndUpdate(
            obj._id,
            newProduct,
            {
              new: true,
            }
          );
        }
      );
      //res.status(200).json({ success: true, message: "Product updated" });
    } catch (error) {
      console.log("error in fetching products:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  let stats = {
    stat: {
      strongbuy: 0,
      buy: 0,
      sell: 0,
      strongsell: 0,
      hold: 0,
    },
    userid: user.userid,
  };
  const products1 = await Product.find({ userid: user.userid });
  let products = [
    {
      product: {
        recosBar: {
          meanValue: 0,
        },
      },
    },
  ];
  products = products1;
  products1.map((obj) => {
    if (
      obj.product.recosBar.meanValue >= 0 &&
      obj.product.recosBar.meanValue <= 1
    ) {
      stats.stat.strongbuy += 1;
    }
    if (
      obj.product.recosBar.meanValue > 1 &&
      obj.product.recosBar.meanValue <= 2
    ) {
      stats.stat.buy += 1;
    }
    if (
      obj.product.recosBar.meanValue > 2 &&
      obj.product.recosBar.meanValue <= 3
    ) {
      stats.stat.hold += 1;
    }
    if (
      obj.product.recosBar.meanValue > 3 &&
      obj.product.recosBar.meanValue <= 4
    ) {
      stats.stat.sell += 1;
    }
    if (
      obj.product.recosBar.meanValue > 4 &&
      obj.product.recosBar.meanValue <= 5
    ) {
      stats.stat.strongsell += 1;
    }
  });

  try {
    const updatedProduct = await stat.findOneAndUpdate(
      { userid: user.userid },
      stats,
      {
        new: true,
      }
    );
    const final = mailing(user);
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.log("error in deleting product:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const sendMail = async (req, res) => {
  const products3 = await Product.find({});
  var transporter = createTransport({
    service: "gmail",
    auth: {
      user: "temp1sanman014@gmail.com",
      pass: "euwc alvn niwf nwzj",
    },
  });
  const stats = await stat.find({});
  const getColour = (value) => {
    if (value >= 0 && value <= 1) {
      return `
            <span style="color:#02552E">&#9675;</span>
         <span class="status-text "> Strong Buy</span>
       `;
    }
    if (value > 1 && value <= 2) {
      return `
            <span style="color:#06AA5A">&#9675;</span>
         <span class="status-text "> Buy</span>
       `;
    }
    if (value > 2 && value <= 3) {
      return `
            <span style="color:#898989">&#9675;</span>
         <span class="status-text "> Hold</span>
       `;
    }
    if (value > 3 && value <= 4) {
      return `
            <span style="color:#FF0000">&#9675;</span>
         <span class="status-text "> Sell</span>
       `;
    }
    if (value > 4 && value <= 5) {
      return `
            <span style="color:#B40000">&#9675;</span>
         <span class="status-text "> Strong Sell</span>
       `;
    }
  };

  var mailOptions = {
    from: "temp1sanman014@gmail.com",
    to: "sanman014@gmail.com",
    subject: " Your watchlist Summary report - " + new Date().toISOString(),
    html:
      `<!DOCTYPE html>
<html>
<head>
<title>[CodePen Spark] Tab Details, Cool :has() Tricks, and a Skating Bunny</title>
<link rel="important stylesheet" href="chrome://messagebody/skin/messageBody.css">
</head>
<body>
<br>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
    Your summary report
  </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; ">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
   @import "https://s3-us-west-2.amazonaws.com/s.cdpn.io/584938/dashboard.scss";
 body {
	 background-color: #1b2431;
	 color: #202020;
	 font-family: "Montserrat", "Helvetica", "Open Sans", "Arial";
	 font-size: 13px;
}
 a:hover {
	 text-decoration: none;
}
 p, figure {
	 margin: 0;
	 padding: 0;
}
 .navbar {
	 background-color: #1b2431;
}
 .sidebar {
	 background-color: #1b2431;
	 box-shadow: none;
}
 .sidebar .nav-link {
	 border-left: 5px solid transparent;
	 color: #738297;
	 padding: 0.5rem 0.75rem;
}
 .sidebar .nav-link:hover {
	 color: white;
}
 .sidebar .nav-link.active {
	 border-left: 5px solid #738297;
	 color: white;
}
 .sidebar .zmdi {
	 display: inline-block;
	 font-size: 1.35rem;
	 margin-right: 5px;
	 min-width: 25px;
}
 .card-list {
	 width: 100%;
}
 .card-list:before, .card-list:after {
	 content: " ";
	 display: table;
}
 .card-list:after {
	 clear: both;
}
 .card {
	 border-radius: 8px;
	 color: white;
	 padding: 10px;
	 position: relative;
}
 .card-list .row1 {
        display: flex;
        justify-content: space-around;
        margin-bottom: 40px;
        margin-top: 40px;
}
 .card .zmdi {
	 color: white;
	 font-size: 28px;
	 opacity: 0.3;
	 position: absolute;
	 right: 13px;
	 top: 13px;
}
 .card .stat {
	 border-top: 1px solid rgba(255, 255, 255, 0.3);
	 font-size: 8px;
	 margin-top: 25px;
	 padding: 10px 10px 0;
	 text-transform: uppercase;
}
 .card .title {
	 display: inline-block;
	 font-size: 8px;
	 padding: 10px 10px 0;
	 text-transform: uppercase;
}
 .card .value {
	 font-size: 12px;
	 padding: 0 10px;
}
 .card.blue {
	 background-color: #2298f1;
}
 .card.yellow {
	 background-color: grey;
}
 .card.green {
	 background-color: #66b92e;
}
 .card.orange {
	 background-color: #da932c;
}
 .card.red {
	 background-color: #d65b4a;
}
 .projects {
	 background-color: #273142;
	 border: 1px solid #313d4f;
	 overflow-x: auto;
	 width: 100%;
}
 .projects-inner {
	 border-radius: 4px;
}
 .projects-header {
	 color: white;
	 padding: 22px;
}
 .projects-header .count, .projects-header .title {
	 display: inline-block;
}
 .projects-header .count {
	 color: #738297;
}
 .projects-header .zmdi {
	 cursor: pointer;
	 float: right;
	 font-size: 16px;
	 margin: 5px 0;
}
 .projects-header .title {
	 font-size: 21px;
}
 .projects-header .title + .count {
	 margin-left: 5px;
}
 .projects-table {
	 background: #273142;
	 width: 100%;
}
 .projects-table td, .projects-table th {
	 color: white;
	 padding: 10px 22px;
	 vertical-align: middle;
}
 .projects-table td p {
	 font-size: 12px;
}
 .projects-table td p:last-of-type {
	 color: #738297;
	 font-size: 11px;
}
 .projects-table th {
	 background-color: #313d4f;
}
 .projects-table tr:hover {
	 background-color: #303d52;
}
 .projects-table tr:not(:last-of-type) {
	 border-bottom: 1px solid #313d4f;
}
 .projects-table .member figure, .projects-table .member .member-info {
	 display: inline-block;
	 vertical-align: top;
}
 .projects-table .member figure + .member-info {
	 margin-left: 7px;
}
 .projects-table .member img {
	 border-radius: 50%;
	 height: 32px;
	 width: 32px;
}
 .projects-table .status > form {
	 float: right;
}
 .projects-table .status-text {
	 display: inline-block;
	 font-size: 12px;
	 margin: 11px 0;
	 padding-left: 20px;
	 position: relative;
}
 .projects-table .status-text:before {
	 border: 3px solid;
	 border-radius: 50%;
	 content: "";
	 height: 14px;
	 left: 0;
	 position: absolute;
	 top: 1px;
	 width: 14px;
}
 .projects-table .status-text.status-blue:before {
	 border-color: #1c93ed;
}
 .projects-table .status-text.status-green:before {
	 border-color: #66b92e;
}
 .projects-table .status-text.status-orange:before {
	 border-color: #da932c;
}
 .projects-table .status-text.status-red:before {
	 border-color: #d65b4a;
}
 .selectric {
	 background-color: transparent;
	 border-color: #313d4f;
	 border-radius: 4px;
}
 .selectric .label {
	 color: #738297;
	 line-height: 34px;
	 margin-right: 10px;
	 text-align: left;
}
 .selectric-wrapper {
	 float: right;
	 width: 150px;
}
 .chart {
	 border-radius: 3px;
	 border: 1px solid #313d4f;
	 color: white;
	 padding: 10px;
	 position: relative;
	 text-align: center;
}
 .chart canvas {
	 height: 400px;
	 margin: 20px 0;
	 width: 100%;
}
 .chart .actions {
	 margin: 15px;
	 position: absolute;
	 right: 0;
	 top: 0;
}
 .chart .actions span {
	 cursor: pointer;
	 display: inline-block;
	 font-size: 20px;
	 margin: 5px;
	 padding: 4px;
}
 .chart .actions .btn-link {
	 color: white;
}
 .chart .actions .btn-link i {
	 font-size: 1.75rem;
}
 .chart .title {
	 font-size: 18px;
	 margin: 0;
	 padding: 15px 0 5px;
}
 .chart .title + .tagline {
	 margin-top: 10px;
}
 .chart .tagline {
	 font-size: 12px;
}
 .danger-item {
	 border-left: 4px solid #a84d43;
}
 .zmdi {
	 line-height: 1;
	 vertical-align: middle;
}

 

  </style>
  <!--[if mso]>
    <noscript>
    <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
    </xml>
    </noscript>
    <![endif]-->
  <!--[if lte mso 11]>
    <style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style>
    <![endif]-->
  <!--[if !mso]><!-->
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css?family=Lato:300,400,500,700);

  </style>
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }

      .mj-column-per-50 {
        width: 50% !important;
        max-width: 50%;
      }
    }

  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }

    .moz-text-html .mj-column-per-50 {
      width: 50% !important;
      max-width: 50%;
    }

  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }

  </style>
  <style type="text/css">
    @media screen {
      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 400;
        src: local('Lato Regular'), local('Lato-Regular'),
          url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 700;
        src: local('Lato Bold'), local('Lato-Bold'),
          url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: italic;
        font-weight: 400;
        src: local('Lato Italic'), local('Lato-Italic'),
          url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
      }

      @font-face {
        font-family: 'Lato';
        font-style: normal;
        font-weight: 900;
        src: local('Lato Black'), local('Lato-Black'),
          url(https://fonts.gstatic.com/s/lato/v14/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2) format('woff2');
      }
    }

    body {
      font-family: Lato, 'Lucida Grande', 'Lucida Sans Unicode', Tahoma, sans-serif;
      font-size: 18px;
      line-height: 1.5;
      color: #e3e4e8;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    p,
    li {
      color: #e3e4e8;
      line-height: 1.5;
      font-size: 18px;
      margin: 0 0 15px 0;
    }

    li {
      margin-bottom: 10px;
    }

    blockquote {
      background: none;
      border-left: 1px solid gray;
      padding-left: 10px;
      margin: 0 0 15px 10px;
    }

    h1,
    h2,
    h3 {
      color: white;
    }

    h1 {
      font-size: 28px;
      margin: 0 0 15px 0;
      line-height: 1.2;
    }

    h2 {
      font-size: 26px;
      margin: 0;
      line-height: 1.2;
    }

    h3 {
      font-size: 24px;
      margin: 20px 0 10px 0;
      line-height: 1.2;
    }

    .news-content a,
    .spark-item a,
    .subscription-details a,
    .pro-content a {
      text-decoration: none;
      color: #76adff;
    }

    pre {
      white-space: pre-wrap;
      line-height: 1.8;
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    }

    .view-on-web-link {
      color: #74c5ff;
      text-transform: uppercase;
      display: block;
      padding: 5px 10px;
      background: #383b43;
      width: 66%;
      margin: 0 auto;
      clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
      text-decoration: none;
    }

    .dedicated-hero-area-copy {
      padding: 20px;
    }

    .dedicated-hero-area-copy h2 {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      text-align: center;
      margin: 0 0 20px 0;
      font-size: 32px;
      line-height: 1.2;
    }
    .dedicated-hero-area-copy h3 {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      text-align: center;
      margin: 0 0 20px 0;
      font-size: 26px;
      line-height: 1.2;
    }

    .spark-item {
      margin-bottom: 50px;
    }

    .spark-item[data-type='sponsor'] .spark-item-type {
      color: #fedd41;
    }

    .spark-item-type {
      color: #99a3bc;
      padding-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 10px;
    }

    .spark-title {
      font-weight: bold;
      color: #505050;
      padding: 5px 0 5px 0;
      font-size: 20px;
      line-height: 1.2;
    }

    .spark-desc {
      padding-top: 4px;
      color: #cccfdc;
      font-size: 15px;
      line-height: 1.4;
    }

    .spark-thumb {
      border: 0;
      display: block;
      height: auto;
      max-width: 100%;
      outline: none;
      text-decoration: none;
      margin: 0 0 10px 0;
    }
    
    .fem-callout {
      background: #dd7932;
      color: white;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 60px;
      line-height: 1.4;
    }
    .fem-callout p {
      font-size: 14px;
    }
    .fem-callout a {
      color: #fffd00;
    }
    .fem-callout h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    .news-header {
      font-family: 'Lato', system-ui, Lato, sans-serif;
      margin: 0 0 5px 0;
      font-size: 36px;
      text-align: left;
      color: white;
    }

    .news-bar {
      height: 5px;
      border-radius: 100px;
      background: white;
      background: linear-gradient(92.63deg,
          #769aff 8.23%,
          #ffdd40 25.83%,
          #f19994 51.91%,
          #47cf73 68.56%);
      width: 70%;
      margin: 0 0 10px 0;
    }

    .pro-bar {
      height: 5px;
      border-radius: 100px;
      background: #ffdb00;
      width: 70%;
      margin: 0 0 10px 0;
    }

    .pro-header {
      text-align: left;
    }

    .pro-header a {
      color: #ffdb00;
      text-decoration: none;
    }

    .footer-bar {
      height: 10px;
      background: linear-gradient(92.63deg,
          #769aff 8.23%,
          #ffdd40 25.83%,
          #f19994 51.91%,
          #47cf73 68.56%);
    }

    @media only screen and (max-width: 400px) {
      h1 {
        font-size: 22px;
      }

      p {
        font-size: 14px;
      }

      .spark-thumb {
        display: block;
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
    }

  </style>
</head>

<body style="word-spacing:normal;background-color:#1c1d22;">
<nav class="navbar navbar-dark sticky-top flex-md-nowrap p-0">
	<a  style="color:white;font-size:12px;padding:10px" class="navbar-brand col-sm-3 col-md-2 mr-0" href="#">Link to the dashboard</a>

	
</nav>
<div class="container-fluid">
	<div >
	
		<main role="main" >
			<div class="card-list" >
				
					<div  style="display: flex;justify-content:space-around;padding:30px;margin-top:40px;" >
				   <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card blue">
							<div class="title">Strong Buy</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.strongbuy}</div>
							<div class="stat"><b>${
                100 *
                (stats[0].stat.strongbuy /
                  (stats[0].stat.buy +
                    stats[0].stat.hold +
                    stats[0].stat.sell +
                    stats[0].stat.strongsell))
              }</b>% 
						   </div>
					</div>
          </div>
         
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card green">
							<div class="title">Buy</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.buy}</div>
							<div class="stat"><b>${
                100 *
                (stats[0].stat.buy /
                  (stats[0].stat.buy +
                    stats[0].stat.hold +
                    stats[0].stat.sell +
                    stats[0].stat.strongsell))
              }</b>% </div>
						</div>
						</div>
					
          <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card yellow">
							<div class="title">Hold</div>
							<i class="zmdi zmdi-upload"></i>
							<div class="value">${stats[0].stat.hold}</div>
							<div class="stat"><b>${
                100 *
                (stats[0].stat.hold /
                  (stats[0].stat.buy +
                    stats[0].stat.hold +
                    stats[0].stat.sell +
                    stats[0].stat.strongsell))
              }</b>% </div>
						</div>
					</div>
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card orange">
							<div class="title">Sell</div>
							<i class="zmdi zmdi-download"></i>
							<div class="value">${stats[0].stat.sell}</div>
							<div class="stat"><b>${
                100 *
                (stats[0].stat.sell /
                  (stats[0].stat.buy +
                    stats[0].stat.hold +
                    stats[0].stat.sell +
                    stats[0].stat.strongsell))
              }</b>% </div>
						</div>
					</div>
					<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4" style="padding:1%;min-width:18%;">
						<div class="card red">
							<div class="title">Strong sell</div>
							<i class="zmdi zmdi-download"></i>
								<div class="value">${stats[0].stat.strongsell}</div>
							<div class="stat"><b>${
                100 *
                (stats[0].stat.strongsell /
                  (stats[0].stat.buy +
                    stats[0].stat.hold +
                    stats[0].stat.sell +
                    stats[0].stat.strongsell))
              }</b>% </div>
						</div>
					</div>
				</div>
			</div>
			<div class="projects mb-4">
				<div class="projects-inner">
					<header class="projects-header">
						<div class="title">Current list</div>
						<div class="count">| ${products3.length} Stocks</div>
						<i class="zmdi zmdi-download"></i>
					</header>
					<table class="projects-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Price NSE</th>
                <th>Price BSE</th>
								<th>Percent change </th>
								<th>Recomendation</th>
								
							</tr>
						</thead>
            ` +
      products3.map((obj) => {
        return `	<tr>
							<td>
								<p>${obj.product.companyName}</p>
								<p style="color: #738297;
    font-size: 11px;">${obj.product.companyProfile.exchangeCodeNse}</p>
							</td>
							<td>
								<p>${obj.product.currentPrice.NSE}</p>
							
							</td>
              	<td>
								<p>${obj.product.currentPrice.BSE}</p>
								
							</td>
							<td class="member">
								<figure>
                <p>
                ${
                  parseFloat(
                    obj.product.stockDetailsReusableData.percentChange
                  ) > 0
                    ? "↑"
                    : "↓"
                }
                </p>
                </figure>
								<div class="member-info">
									<p>${obj.product.stockDetailsReusableData.percentChange}</p>
								
								</div>
							</td>
						
							<td class="status">
              ${getColour(obj.product.recosBar.meanValue)}
							</td>
							
						</tr>
						`;
      }) +
      `
					
					</table>
				</div>
			</div>
		
		</main>
	</div>
</div>
</body>

</html>

</body>
</html>
</table></div>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("error in sending report:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Email sent: " + info.response });
    }
  });
};
