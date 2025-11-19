module.exports = (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2>Processing payment...</h2>
        <p>You can close this page now.</p>
      </body>
    </html>
  `);
};
