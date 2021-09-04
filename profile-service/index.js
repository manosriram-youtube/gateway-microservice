const express = require("express");
const app = express();
const PORT = 5002;
const amqp = require("amqplib");

var connection, channel;

async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PROFILE");
}

const fakeUser = {
    name: "Mano",
    userId: "mano1234",
    lastLoggedIn: "03-09-2021"
};

connect().then(async () => {
    channel.consume("PROFILE", msg => {
        channel.ack(msg);
        let data = JSON.parse(msg.content.toString());
        if (data.call === "ORDER_WITH_USER") {
            data.user = fakeUser;
            channel.sendToQueue("ORDER", Buffer.from(JSON.stringify(data)));
        } else {
            channel.sendToQueue("GATEWAY", Buffer.from(JSON.stringify(fakeUser)));
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server at ${PORT}`);
});
