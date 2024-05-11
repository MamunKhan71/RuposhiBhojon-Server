const { MongoClient, ServerApiVersion } = require('mongodb')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173"]
}))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.q3zjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

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
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const database = client.db('RuposhiBhojon')
        const foodCollection = database.collection('foods')

        app.get('/featured', async (req, res) => {
            const cursor = foodCollection.find().sort({ food_quantity: -1 }).limit(6)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/foodCount', async (req, res) => {
            const count = await foodCollection.estimatedDocumentCount()
            res.send({ count })
        })
        app.get('/foods', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const result = await foodCollection.find()
                .skip(page * size).limit(size).toArray()
            res.send(result);
        })
        app.get('/search', async (req, res) => {
            const search = req.query.searchText
            const query = foodCollection.find({ food_name: { $regex: `${search}` } })
            const result = await query.toArray()
            res.send(result);
        })

    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log("Server running on port: ", port);
})