const express = require('express');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


const port = process.env.PORT || 3000;
// middleware
app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://
@cluster0.uma9m7n.mongodb.net/?retryWrites=true&w=majority`;

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
        const classCollection = client.db('fitnessDB').collection("class")
        const forumCollection = client.db('fitnessDB').collection("forum")
        const paymentCollection = client.db('fitnessDB').collection("payment")

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
        app.get('/users', verifyToken, async (req, res) => {
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

        app.get('/users/trainer/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let trainer = false
            if (user) {
                trainer = user?.role === 'trainer'
            }
            res.send({ trainer })
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

        app.patch('/users/trainer/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            console.log(filter)
            const updateDoc = {
                $set: {
                    role: 'trainer'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
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
        app.post('/trainer', verifyToken, async (req, res) => {
            const trainer = req.body;
            const result = await trainerCollection.insertOne(trainer)
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

        // add class api
        app.post('/addClass', async (req, res) => {
            const addClass = req.body;
            const result = await classCollection.insertOne(addClass)
            res.send(result)
        })

        app.get('/addClass', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })

        // forum related api
        app.get('/forum', async (req, res) => {
            const result = await forumCollection.find().toArray()
            res.send(result)
        })
        app.post('/forum', async (req, res) => {
            const addClass = req.body;
            const result = await forumCollection.insertOne(addClass)
            res.send(result)
        })

        app.put('/forum/upvote/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true }
            const updatedPost = {
                $inc: {
                    upVotes: 1
                }
            }
            const result = await forumCollection.updateOne(filter, updatedPost, options)
            res.send(result)
        });

        app.put('/forum/downvote/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true }
            const updatedPost = {
                $inc: {
                    downVotes: 1
                }
            }
            const result = await forumCollection.updateOne(filter, updatedPost, options)
            res.send(result)
        });

        // payment method
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100);
            console.log(amount, 'amount inside the intent')
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']

            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body
            const paymentResult = await paymentCollection.insertOne(payment)
            res.send(paymentResult);
        })

        app.get('/payments', verifyToken, verifyAdmin, async (req, res) => {
            const result = await paymentCollection.find(query).toArray();
            res.send(result)
        })

        // admin stats
        app.get('/admin-stats', async (req, res) => {
            const users = await userCollection.estimatedDocumentCount()
            const trainers = await trainerCollection.estimatedDocumentCount()
            const subscribers = await subscribeCollection.estimatedDocumentCount()

            const result = await paymentCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: '$price'
                        }
                    }
                }
            ]).toArray()
            const revenue = result.length > 0 ? result[0].totalRevenue : 0;
            res.send({
                users,
                trainers,
                subscribers,
                revenue
            })
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