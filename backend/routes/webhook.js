
import crypto from 'crypto'
import express from "express"
const router = express.Router();

router.post('/', express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const userId = parseInt(payment.notes.userId);
    const planType = payment.notes.planType;

    try {
      const sub = await prisma.subscription.findUnique({
        where: { type: planType },
      });

      if (!sub) return res.status(404).send('Plan not found');

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: sub.id },
      });

      return res.status(200).send('Payment captured & plan updated');
    } catch (err) {
      console.error(err);
      return res.status(500).send('Failed to update user plan');
    }
  }

  return res.status(200).send('Event ignored');
});


export default router;