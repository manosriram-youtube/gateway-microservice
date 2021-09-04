const express = require("express");
const app = express();
const PORT = 5001;
const amqp = require("amqplib");

var connection, channel;

async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}

connect().then(async () => {
    channel.consume("ORDER", (data) => {
        channel.ack(data);
        const { name, price, user } = JSON.parse(data.content.toString());
        let newOrder = {
            name,
            price,
            orderId: "123abc",
        };

        if (user) {
            newOrder.user = user;
            newOrder.call = "ORDER_WITH_USER";
            channel.sendToQueue(
                "GATEWAY",
                Buffer.from(JSON.stringify(newOrder))
            );
        } else {
            newOrder.call = "ORDER_WITH_USER";
            channel.sendToQueue(
                "PROFILE",
                Buffer.from(JSON.stringify(newOrder))
            );
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server at ${PORT}`);
});
