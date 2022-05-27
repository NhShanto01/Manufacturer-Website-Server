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


        // Get-METHOD

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