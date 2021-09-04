const express = require("express");
const app = express();
const PORT = 5000;
const amqp = require("amqplib");

var connection, channel;

async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("GATEWAY");
}
connect();

const fakeOrder = {
    name: "Order1",
    price: 2500
};

async function consumeGatewayQueue(cb) {
    channel.consume("GATEWAY", msg => {
        channel.ack(msg);
        const data = JSON.parse(msg.content.toString());
        if (data.call === "ORDER_WITH_USER") {
            // Order Service
            delete data.call;
            cb(data);
        } else {
            // Profile Service
            cb(data);
        }
    });
}

var order, fakeUser;
app.get("/", async (req, res) => {
    const { call } = req.query;

    if (call === "ORDER") {
        channel.sendToQueue("ORDER", Buffer.from(JSON.stringify(fakeOrder)));
        consumeGatewayQueue(function (data) {
            order = data;
        });

        return res.json(order);
    } else if (call === "PROFILE") {
        channel.sendToQueue("PROFILE", Buffer.from(JSON.stringify({ call: "USER_PROFILE" })));

        consumeGatewayQueue(function (data) {
            fakeUser = data;
        });
        return res.json(fakeUser);
    }

});


app.listen(PORT, () => {
    console.log(`Server at ${PORT}`);
});
