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

        // jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: "2h"
            })
            res.send({ token })
          })

        // users api
        app.post('/users', async(req,res)=>{
            const user = req.body
            const query = {email: user.email}
            const existingUser = await userCollection.findOne(query)
            if(existingUser){
                return res.send({message: "user already exists", insertedId: null})
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        // newsletter api
        app.get('/subscribe', async(req,res)=>{
            const result = await subscribeCollection.find().toArray()
            res.send(result)
        })
        app.get('/trainer', async(req,res)=>{
            const result = await trainerCollection.find().toArray()
            res.send(result)
        })
        app.get('/trainer/:id', async(req,res)=>{
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await trainerCollection.findOne(query)
            res.send(result)
        })
        app.post('/subscribe', async(req,res)=>{
            const user = req.body
            const query = {email: user.email}
            const existingUser = await subscribeCollection.findOne(query)
            console.log(user, existingUser)
            if(existingUser){
                return res.send({message: "already subscribe", insertedId: null})
            }
            const result = await subscribeCollection.insertOne(user)
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