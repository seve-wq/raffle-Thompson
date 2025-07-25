const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Email transporter
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate unique ticket numbers
function generateTicketNumbers(quantity) {
    const tickets = [];
    const usedNumbers = new Set();
    
    while (tickets.length < quantity) {
        const ticketNumber = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
        if (!usedNumbers.has(ticketNumber)) {
            usedNumbers.add(ticketNumber);
            tickets.push(ticketNumber.toString());
        }
    }
    
    return tickets;
}

// Send confirmation email
async function sendConfirmationEmail(customerEmail, customerName, ticketNumbers, amount, quantity) {
    const ticketList = ticketNumbers.map(num => `Ticket #${num}`).join('\n');
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: '🎫 Your Raffle Tickets - Thompson\'s Roofing',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">🎫 Raffle Tickets Confirmed!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
                    
                    <p style="color: #666; line-height: 1.6;">Your raffle ticket purchase has been confirmed! Here are your ticket details:</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">📋 Purchase Summary</h3>
                        <p><strong>Quantity:</strong> ${quantity} ticket(s)</p>
                        <p><strong>Total Amount:</strong> $${amount}</p>
                        <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #28a745; margin-top: 0;">🎫 Your Ticket Numbers</h3>
                        <div style="font-family: monospace; font-size: 18px; color: #333;">
                            ${ticketNumbers.map(num => `<div style="padding: 5px 0;">Ticket #${num}</div>`).join('')}
                        </div>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #856404; margin-top: 0;">📝 Important Information</h3>
                        <ul style="color: #666; line-height: 1.6;">
                            <li>Please save this email for your records</li>
                            <li>Your ticket numbers are unique and secure</li>
                            <li>Winners will be contacted directly</li>
                            <li>Good luck! 🍀</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 14px;">
                            Thank you for supporting Thompson's Roofing!<br>
                            For questions, contact us at info@rafflearoof.com
                        </p>
                    </div>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${customerEmail}:`, error);
        return false;
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            console.log(`✅ Processing payment for session: ${session.id}`);
            
            // Extract payment details
            const customerEmail = session.customer_details?.email;
            const customerName = session.customer_details?.name || 'Customer';
            const amount = session.amount_total / 100; // Convert from cents
            const quantity = session.metadata?.quantity || 1;
            const ticketsPerUnit = session.metadata?.ticketsPerUnit || 1;
            const totalTickets = quantity * ticketsPerUnit;
            
            // Generate unique ticket numbers
            const ticketNumbers = generateTicketNumbers(totalTickets);
            
            // Save to Supabase database
            const { data, error } = await supabase
                .from('raffle_tickets')
                .insert([{
                    stripe_session_id: session.id,
                    payment_intent_id: session.payment_intent,
                    customer_email: customerEmail,
                    customer_name: customerName,
                    quantity: quantity,
                    tickets_per_unit: ticketsPerUnit,
                    total_tickets: totalTickets,
                    amount: amount,
                    ticket_numbers: ticketNumbers,
                    status: 'paid'
                }])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Database error:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            
            console.log(`✅ Ticket data saved to database: ${data.id}`);
            
            // Send confirmation email
            const emailSent = await sendConfirmationEmail(
                customerEmail,
                customerName,
                ticketNumbers,
                amount,
                totalTickets
            );
            
            if (!emailSent) {
                console.warn(`⚠️ Email failed to send for session: ${session.id}`);
            }
            
            console.log(`✅ Webhook processed successfully for session: ${session.id}`);
            
        } catch (error) {
            console.error('❌ Error processing webhook:', error);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    res.json({ received: true });
}; 