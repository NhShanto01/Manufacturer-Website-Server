const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

//dbuser= dbuser01
//pass= RXXWzB7k1EuNDwat




var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-shard-00-00.fwma6.mongodb.net:27017,cluster0-shard-00-01.fwma6.mongodb.net:27017,cluster0-shard-00-02.fwma6.mongodb.net:27017/?ssl=true&replicaSet=atlas-jxxlva-shard-0&authSource=admin&retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.send(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        console.log('connected');
        const carPartCollection = client.db("car-parts").collection("parts");
        const userCollection = client.db("car-parts").collection("users");
        const profileCollection = client.db("car-parts").collection("profiles");
        const orderCollection = client.db("car-parts").collection("orders");
        const reviewCollection = client.db("car-parts").collection("reviews");

        // CarParts - section

        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = carPartCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        });
        app.get('/parts/:id', async (req, res) => {
            const id = req.params?.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await carPartCollection.findOne(query);
            res.send(result);
        });

        app.delete('/delete/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await carPartCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/add', async (req, res) => {
            const newItem = req.body;
            const result = await carPartCollection.insertOne(newItem);
            res.send(result);
        });


        // User - section



        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users)
        });


        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        });

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role == 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }

        });


        app.delete('/delete/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });



        // Profile - section

        app.post('/update', async (req, res) => {
            const newItem = req.body;
            const result = await profileCollection.insertOne(newItem);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const result = await profileCollection.findOne({ email })
            if (result) {
                res.send(result);
            }
            else {
                res.send('User not Found')
            }
        })


        // Order - section

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.get('/order', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { customer: email }
            const order = await orderCollection.find(query).toArray();
            res.send(order);
        });
        app.get('/order/:id', async (req, res) => {
            const id = req.params?.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);
        });

        app.delete('/delete/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/allorder', async (req, res) => {
            const order = await orderCollection.find({}).toArray();
            res.send(order);
        });


        // Review -section

        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.post('/review', async (req, res) => {
            const newPost = req.body;
            const result = await reviewCollection.insertOne(newPost);
            res.send(result);
        });

        // Payment - section

        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });

    }
    finally {
        // await client.close();
    }

}

run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello From prot 5000!')
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});