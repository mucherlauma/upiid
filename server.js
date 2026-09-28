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
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "admin.html")
    );
});

app.get("/api/payment-config", (req, res) => {
    res.json({
        upiId: process.env.UPI_ID,
        merchantName:
            process.env.MERCHANT_NAME || "Your Store",
        amount:
            process.env.PAYMENT_AMOUNT || "1"
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

        const { data, error } =
            await supabase
                .from("payments")
                .insert([
                    {
                        transaction_id:
                            transactionId,

                        upi_id:
                            upiId,

                        amount:
                            Number(amount),

                        payment_method:
                            paymentMethod,

                        status:
                            "PENDING"
                    }
                ])
                .select();

        if (error) {

            console.error(
                "Supabase Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Payment record create failed"
            });

        }

        res.json({
            success: true,
            transactionId:
                transactionId,
            payment:
                data[0]
        });

    } catch (error) {

        console.error(
            "Server Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

app.get(
    "/api/payment-status/:transactionId",
    async (req, res) => {

        try {

            const transactionId =
                req.params.transactionId;

            const { data, error } =
                await supabase
                    .from("payments")
                    .select(
                        "transaction_id, amount, payment_method, status, created_at"
                    )
                    .eq(
                        "transaction_id",
                        transactionId
                    )
                    .single();

            if (error || !data) {

                return res.status(404).json({
                    success: false,
                    status: "NOT_FOUND"
                });

            }

            res.json({
                success: true,
                transactionId:
                    data.transaction_id,

                amount:
                    data.amount,

                paymentMethod:
                    data.payment_method,

                status:
                    data.status,

                createdAt:
                    data.created_at
            });

        } catch (error) {

            console.error(
                "Payment Status Error:",
                error
            );

            res.status(500).json({
                success: false,
                status: "ERROR"
            });

        }

    }
);

app.get(
    "/api/admin/payments",
    async (req, res) => {

        try {

            const { data, error } =
                await supabase
                    .from("payments")
                    .select(
                        "id, transaction_id, upi_id, amount, payment_method, status, created_at"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );

            if (error) {

                console.error(
                    "Admin Payments Error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Payments load failed"
                });

            }

            res.json({
                success: true,
                payments:
                    data || []
            });

        } catch (error) {

            console.error(
                "Admin Server Error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });

        }

    }
);

app.put(
    "/api/admin/payment/:transactionId",
    async (req, res) => {

        try {

            const transactionId =
                req.params.transactionId;

            const status =
                req.body.status;

            if (
                status !== "APPROVED" &&
                status !== "REJECTED"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment status"
                });

            }

            const { data, error } =
                await supabase
                    .from("payments")
                    .update({
                        status: status
                    })
                    .eq(
                        "transaction_id",
                        transactionId
                    )
                    .select();

            if (error) {

                console.error(
                    "Payment Update Error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Payment status update failed"
                });

            }

            if (
                !data ||
                data.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Payment not found"
                });

            }

            res.json({
                success: true,
                message:
                    "Payment status updated",
                payment:
                    data[0]
            });

        } catch (error) {

            console.error(
                "Admin Update Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Server error"
            });

        }

    }
);

app.get("/api/health", (req, res) => {

    res.json({
        status: "OK",
        message:
            "Payment server is running"
    });

});

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
