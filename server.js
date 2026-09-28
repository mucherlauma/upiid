const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/payment-config", (req, res) => {

    res.json({
        upiId: process.env.UPI_ID,
        merchantName: process.env.MERCHANT_NAME || "Your Store",
        amount: process.env.PAYMENT_AMOUNT || "500"
    });

});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
