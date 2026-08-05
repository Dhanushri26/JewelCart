import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
    DynamoDBDocumentClient,
    GetCommand
} from "@aws-sdk/lib-dynamodb";

import {
    SESClient,
    SendEmailCommand
} from "@aws-sdk/client-ses";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const docClient = DynamoDBDocumentClient.from(client);

const ses = new SESClient({
    region: process.env.AWS_REGION,
});

async function sendOrderConfirmationEmail(order) {

    const items = order.items
        .map(
            item =>
                `• ${item.title} × ${item.quantity} - ₹${item.lineTotal.toLocaleString()}`
        )
        .join("\n");

    const command = new SendEmailCommand({

        Source: process.env.SENDER_EMAIL,

        Destination: {
            ToAddresses: [order.customerEmail],
        },

        Message: {

            Subject: {
                Data: `JewelCart Order Confirmation - ${order.orderId}`,
            },

            Body: {

                Text: {

                    Data:
`Hello,

Thank you for shopping with JewelCart.

Your order has been confirmed successfully.

Order ID:
${order.orderId}

Items:
${items}

Total Amount:
₹${Number(order.totalAmount).toLocaleString("en-IN")}

Payment Status:
${order.paymentStatus}

We appreciate your purchase and will notify you once your order has been shipped.

Regards,
JewelCart Team`

                }

            }

        }

    });

    await ses.send(command);

    console.log("========== EMAIL SENT ==========");
    console.log(order.customerEmail);

}

export const handler = async (event) => {

  console.log("========== SNS EVENT ==========");
  console.log(JSON.stringify(event, null, 2));

  const record = event.Records[0];

  const message = JSON.parse(record.Sns.Message);

  const orderResult = await docClient.send(
    new GetCommand({
        TableName: process.env.ORDER_TABLE,
        Key: {
            PK: `ORDER#${message.orderId}`,
            SK: "METADATA"
        }
    })
);

const order = orderResult.Item;

if (order.customerEmail) {

    await sendOrderConfirmationEmail(order);

} else {

    console.error("Customer email missing.");

}

console.log("========== ORDER ==========");
console.log(order);

  console.log("========== PAYMENT EVENT ==========");
  console.log(message);

  return {
      statusCode: 200,
      body: JSON.stringify({
          success: true,
          message: "SNS event received."
      })
  };
};