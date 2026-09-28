const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/payment-config", (req, res) => {

    res.json({
        upiId: process.env.UPI_ID,
        merchantName: process.env.MERCHANT_NAME || "Your Store",
        amount: process.env.PAYMENT_AMOUNT || "1"
    });

});

app.post("/api/create-payment", async (req, res) => {

    try {

        const {
            transactionId,
            paymentMethod
        } = req.body;

        if (!transactionId || !paymentMethod) {

            return res.status(400).json({
                success: false,
                message: "Payment details missing"
            });

        }

        const amount =
            process.env.PAYMENT_AMOUNT || "1";

        const upiId =
            process.env.UPI_ID;

        const { data, error } = await supabase
            .from("payments")
            .insert([
                {
                    transaction_id: transactionId,
                    upi_id: upiId,
                    amount: Number(amount),
                    payment_method: paymentMethod,
                    status: "PENDING"
                }
            ])
            .select();

        if (error) {

            console.error("Supabase Error:", error);

            return res.status(500).json({
                success: false,
                message: "Payment record create failed"
            });

        }

        res.json({
            success: true,
            transactionId: transactionId,
            payment: data[0]
        });

    } catch (error) {

        console.error("Server Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

app.get("/api/health", (req, res) => {

    res.json({
        status: "OK",
        message: "Payment server is running"
    });

});

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
