const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

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
        const carUserCollection = client.db("car-parts").collection("users");
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




        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await carUserCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })









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