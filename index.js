const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
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
        const foodRequestCollection = database.collection('requests')
        const userCollection = database.collection('users')
        app.post('/user', async (req, res) => {
            const user = req.body
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        // get requests
        app.get('/featured', async (req, res) => {
            const query = { availability: { $ne: "Reserved" } };
            const cursor = foodCollection.find(query).sort({ food_quantity: -1 }).limit(6)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/foodCount', async (req, res) => {
            const count = await foodCollection.countDocuments({ availability: { $ne: "Reserved" } });
            res.send({ count })
        })
        app.get('/foods', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const query = { availability: { $nin: ["Reserved", "Not Available"] } };
            const result = await foodCollection.find(query)
                .skip(page * size).limit(size).toArray();
            res.send(result);
        })
        app.get('/search', async (req, res) => {
            const search = req.query.search
            console.log(search);
            const queryParams = { availability: { $ne: "Reserved" }, food_name: { $regex: `${search}`, $options: 'i' } };
            const query = foodCollection.find(queryParams);
            const result = await query.toArray();
            res.send(result);
        })
        app.get('/food/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const result = await foodCollection.findOne(query)
            res.send(result)
        })
        app.get('/my-food', async (req, res) => {
            const query = {
                "donator.uid": req.query.user
            };
            const cursor = foodCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // post requests 
        app.post('/add-food', async (req, res) => {
            const data = req.body
            const result = await foodCollection.insertOne(data)
            res.send(result)
        })
        app.post('/food-request', async (req, res) => {
            const data = req.body
            const result = await foodRequestCollection.insertOne(data)
            res.send(result)
        })

        // sort request
        app.get('/time-sort', async (req, res) => {
            const itemsPerPage = parseInt(req.query.itemsPerPage)
            const currentPage = parseInt(req.query.currentPage)
            const filter = req.query.filter
            const queryParams = { availability: { $ne: "Reserved" } };

            let cursor = null
            if (filter === 'time') {
                cursor = foodCollection.find(queryParams).sort({ expired_datetime: -1 })
            } else if (filter === 'quantity') {
                cursor = foodCollection.find(queryParams).sort({ food_quantity: -1 })
            }
            const result = await cursor.skip(currentPage * itemsPerPage).limit(itemsPerPage).toArray()
            res.send(result)
        })

        // patch request
        app.patch('/update-food', async (req, res) => {
            const data = req.body;
            const paramData = req.query?.statusUpdate
            const query = { _id: new ObjectId(data._id) };
            let updateFoodItem = {}
            if (paramData) {
                updateFoodItem = {
                    availability: data?.available,
                }
            } else {
                updateFoodItem = {
                    food_name: data.foodName,
                    food_image: data.foodImage,
                    food_quantity: data.foodQty,
                    expired_datetime: data.expiryDate,
                    pickup_location: data.pickup,
                    availability: data.available,
                    additional_notes: data.notes,
                }
            }
            console.log(updateFoodItem);
            console.log(data._id);
            const update = { $set: updateFoodItem };
            const result = await foodCollection.updateOne(query, update);
            res.send(result);
        });


        // delete request
        app.delete('/delete-food/:id', async (req, res) => {
            const id = req.params.id
            const result = await foodCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        // my requests
        app.get('/my-requests', async (req, res) => {
            const id = req.query.user
            console.log(id);
            const query = { "user.user_id": id }
            const cursor = foodRequestCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.delete('/delete-request', async (req, res) => {
            const id = req.query.id
            const result = await foodRequestCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })


    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log("Server running on port: ", port);
})