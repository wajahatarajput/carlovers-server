const express = require("express");
const CarQuery = require('carquery-api');
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());


app.get("/",(req,res)=>{
    res.send("Hello");
});

app.post("/custom_account",async (req,res)=>{ // needs to recieve the bank account or credit card here and pass in object
    // console.log("work in fun")
    let {mcc,first_name,last_name,day,month,year,email,phone,ssn_last_4,state,city,postal_code,line1,bank_name,bank_country,bank_currency,bank_account_number,bank_account_routing_number,account_holder_name,account_holder_type, front_document} = req.body;

    try {
        const account = await stripe.accounts.create({ 
            country: 'US',
            type: 'custom',
            business_type: 'individual',
            business_profile: {
                mcc: mcc,
                url: 'carlovers.com',
            },
            individual: {
                first_name: first_name,
                last_name: last_name,
                dob : {
                day: day,
                month: month,
                year: year
                    },
                email: email,
                phone: phone,
                ssn_last_4: ssn_last_4,
                address: {
                state: state,
                city:city,
                postal_code:postal_code,
                line1: line1,
                }       
            },
            capabilities: {
            card_payments: {requested: true},
            transfers: {requested: true},
            },
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: req.connection.remoteAddress,
            },
            bank_account: {
                object: 'bank_account',
                bank_name: bank_name,
                country: bank_country,
                currency: bank_currency,
                account_number: bank_account_number,
                routing_number: bank_account_routing_number,
                accounter_holder_name: account_holder_name,
                account_holder_type: account_holder_type,
            },
            // payouts_enabled:true
            // documents:{
            //     front: front_document,
            // }
            //needs bank account or credit card here
            
     });
     res.send(account.id);
    }catch(ex){
        res.send(ex);
    }
//   console.log("Response of stripe :",account)
//   console.log("Response of stripe ID :",account.id)

  
});

// app.post("/custom_card",async (req,res)=>{ // needs to recieve the bank account or credit card here and pass in object
//     // console.log("work in fun")
//     let {mcc,first_name,last_name,day,month,year,email,phone,ssn_last_4,state,city,postal_code,line1,bank_name,bank_country,bank_currency,bank_account_number,bank_account_routing_number,account_holder_name,account_holder_type, front_document} = req.body;

//     const account = await stripe.accounts.create({ 
//             country: 'US',
//             type: 'custom',
//             business_type: 'individual',
//             business_profile: {
//                 mcc: mcc,
//                 url: 'carlovers.com',
//             },
//             individual: {
//                 first_name: first_name,
//                 last_name: last_name,
//                 dob : {
//                 day: day,
//                 month: month,
//                 year: year
//                     },
//                 email: email,
//                 phone: phone,
//                 ssn_last_4: ssn_last_4,
//                 address: {
//                 state: state,
//                 city:city,
//                 postal_code:postal_code,
//                 line1: line1,
//                 }       
//             },
//             capabilities: {
//             card_payments: {requested: true},
//             transfers: {requested: true},
//             },
//             tos_acceptance: {
//                 date: Math.floor(Date.now() / 1000),
//                 ip: req.connection.remoteAddress,
//             },
//             bank_account: {
//                 object: 'bank_account',
//                 bank_name: bank_name,
//                 country: bank_country,
//                 currency: bank_currency,
//                 account_number: bank_account_number,
//                 routing_number: bank_account_routing_number,
//                 accounter_holder_name: account_holder_name,
//                 account_holder_type: account_holder_type,
//             },
//             // payouts_enabled:true
//             // documents:{
//             //     front: front_document,
//             // }
//             //needs bank account or credit card here
//      });
// //   console.log("Response of stripe :",account)
// //   console.log("Response of stripe ID :",account.id)
//   res.send(account.id);
  
// });


app.post("/payment",cors(), async (req,res)=>{
    let {amount,id} = req.body;
    try {
        // console.log("Staring CarloversPayment");
        console.log(amount);
        const payment = await stripe.paymentIntents.create({
            amount,
            currency:"USD",
            description:"Payment For Service",
            payment_method:id,
            confirm:true
        });

        console.log("Ending CarloversPayment");      
        res.json({
            message:"Payment Successful",
            success:true
        });

    } catch (error) {
        // console.log(error);
        // res.json({
        //     message:"Payment Failed",
        //     success:false
        // });
        res.send(error);
    }
    // res.send("Processing Payment");
})

app.post("/createcustomer",cors(), async (req,res)=>{
    let {email,city,line1,line2,zipcode,state,name,country,phone} = req.body;
   console.log("Email",email);
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    try {
        const customer = await stripe.customers.create({
            email: email,
            name: name,
            address: {
                city: city,
                country:country,
                line1: line1,
                line2:line2,
                postal_code: zipcode,
                state: state,
            },
            balance: 0,
            phone: phone,
            shipping: {
                address: {
                    city: city,
                    country:country,
                    line1: line1,
                    line2:line2,
                    postal_code: zipcode,
                    state: state,
                },
                name: name,
                phone: phone
              },
          });
       res.send(customer);
    } catch (error) {
       res.send(error);
    }
})

app.post("/createsetupintent",cors(), async (req,res)=>{
    let {customerid} = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: customerid,
            payment_method_types: ['card'],
          });
       res.send(setupIntent);
    } catch (error) {
       res.send(error);
    }
})

app.post("/createpaymentintent", async (req,res)=>{
    let {customerid,amount,paymentmethodid} = req.body;

    try {
    const paymentIntent = await stripe.paymentIntents.create({
        customer: customerid,
        setup_future_usage: 'off_session',
        amount: amount*100,
        currency: 'usd',
        payment_method: paymentmethodid,
      });
      res.send(paymentIntent);
    } catch (error) {
        res.send(error);
    }
});

app.post("/confirmpaymentintent", async (req,res)=>{
    let {paymentintentid} = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.confirm(
            paymentintentid,
            {payment_method: 'pm_card_visa'}
          );
      res.send(paymentIntent);
    } catch (error) {
        res.send(error);
    }
});



app.post('/createsubscription', async (req, res) => {
    let {customerID,priceID} = req.body;
    try {
      // Create the subscription. Note we're expanding the Subscription's
      // latest invoice and that invoice's payment_intent
      // so we can pass it to the front end to confirm the payment
      const subscription = await stripe.subscriptions.create({
        customer: customerID,
        items: [{
          price: priceID,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        paymentintent: subscription.latest_invoice.payment_intent.id
    });
    // res.send(subscription)
    } catch (error) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  app.post('/getsubscriptions', async (req, res) => {
    let {subcID} = req.body;
    // console.log(subcID)
    try {
      // Create the subscription. Note we're expanding the Subscription's
      // latest invoice and that invoice's payment_intent
      // so we can pass it to the front end to confirm the payment
      const subscription = await stripe.subscriptions.retrieve(
        subcID
      );

      res.send(subscription);
    } catch (error) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  app.post('/cancelsubscription', async (req, res) => {
    let {subcID} = req.body;
    console.log(subcID);
    try {
      // Create the subscription. Note we're expanding the Subscription's
      // latest invoice and that invoice's payment_intent
      // so we can pass it to the front end to confirm the payment
      const deleted = await stripe.subscriptions.del(
        `${subcID}`
      );
  
      res.send(deleted);
    } catch (error) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  app.post('/updatesubscription', async (req, res) => {
    let subcID = req.body;
    console.log(subcID);
    try {
      // Create the subscription. Note we're expanding the Subscription's
      // latest invoice and that invoice's payment_intent
      // so we can pass it to the front end to confirm the payment
      const subscription = await stripe.subscriptions.update(
        subcID
      );
  
      res.send(subscription);
    } catch (error) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });


app.post("/listpaymentmethods",cors(), async (req,res)=>{
    let {customerid} = req.body;
//    console.log("Email",email);
    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerid,
            type: 'card',
          });
       res.send(paymentMethods);
        // console.log(customer)
    } catch (error) {
        // console.log(error);
       res.send(error);
    }
});


app.post("/driverpayment",cors(), async (req,res)=>{
    let {amount,id,driverstripe} = req.body;
    try {
        console.log("Staring Driver Payment");
       // Create a Transfer to the connected account (later):
        const transfer = await stripe.transfers.create({
            amount: amount,
            currency: 'usd',
            destination: driverstripe,
        });
  

        console.log("Ending Driver Payment");      
        // res.json({
        //     message:"Payment Successful",
        //     success:true
        // });
        res.send(transfer);

    } catch (error) {
        console.log(error);
        // res.json({
        //     message:"Payment Failed",
        //     success:false
        // });
        res.send(error);
    }
    // res.send("Processing Payment");
})


// car_query gets all makes
app.get("/makesapi", async (req, res) => {

    await CarQuery.getMakes((err, results) => {
        if (err) {
            res.send(err)
            // console.log("Error :", err);
        } else {
            res.send(results)
            // return console.log("Data :", results); // { minimum: 1940, maximum: 2016 }
        }
    })
})
// car_query gets model details for a model
app.get("/modelapi", async (req, res) => {

    await CarQuery.getModel((err, results) => {
        if (err) {
            res.send(err)
            // console.log("Error :", err);
        } else {
            res.send(results)
            // return console.log("Data :", results); // { minimum: 1940, maximum: 2016 }
        }
    })
})

// car_query gets all models for a make
app.get("/modelsapi", async (req, res) => {

    await CarQuery.getModels((err, results) => {
        if (err) {
            res.send(err)
            // console.log("Error :", err);
        } else {
            res.send(results)
            // return console.log("Data :", results); // { minimum: 1940, maximum: 2016 }
        }
    })
})
// car_query gets the minimum and maximum years
app.get("/yearapi", async (req, res) => {

    await CarQuery.getYears((err, results) => {
        if (err) {
            res.send(err)
            // console.log("Error :", err);
        } else {
            res.send(results)
            // return console.log("Data :", results); // { minimum: 1940, maximum: 2016 }
        }
    })
})


app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server is Listening on PORT : "+process.env.PORT);
});