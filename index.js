const express = require('express');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors');


const port = process.env.PORT || 5000;
// middleware
app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uma9m7n.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db('fitnessDB').collection("users")
        const subscribeCollection = client.db('fitnessDB').collection("subscribe")
        const trainerCollection = client.db('fitnessDB').collection("trainer")
        const beTrainerCollection = client.db('fitnessDB').collection("beTrainer")

        // jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "2h"
            })
            res.send({ token })
        })

        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "unauthorized access" })
                }
                req.decoded = decoded
                next()
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        // users api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            // console.log(email)
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: "user already exists", insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        // newsletter api
        app.get('/subscribe', async (req, res) => {
            const result = await subscribeCollection.find().toArray()
            res.send(result)
        })
        app.post('/subscribe', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await subscribeCollection.findOne(query)
            console.log(user, existingUser)
            if (existingUser) {
                return res.send({ message: "already subscribe", insertedId: null })
            }
            const result = await subscribeCollection.insertOne(user)
            res.send(result)
        })

        // trainer api
        app.get('/trainer', async (req, res) => {
            const result = await trainerCollection.find().toArray()
            res.send(result)
        })
        app.get('/trainer/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await trainerCollection.findOne(query)
            res.send(result)
        })


        //Be trainer related api
        app.get('/beTrainer', async (req, res) => {
            const result = await beTrainerCollection.find().toArray()
            res.send(result)
        })
        app.post('/beTrainer', verifyToken, async (req, res) => {
            const trainer = req.body;
            const result = await beTrainerCollection.insertOne(trainer)
            res.send(result)
        })

        app.delete('/beTrainer/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await beTrainerCollection.deleteOne(query)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Fitness Tracker is now Fighting......')
})
app.listen(port, () => {
    console.log(`Fitness tracker server is running on the port :${port}`)
})