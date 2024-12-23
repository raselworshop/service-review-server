const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5hy3n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        await client.connect();

        const serviceCollection = client.db('ServiceReview').collection('Services')
        const reviewsCollection = client.db('ServiceReview').collection('Reviews')

        // reviews releted 
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review, "review posting")
            try {
                const result = await reviewsCollection.insertOne(review)
                res.status(201).send(result)
            } catch (error) {
                res.status(500).send({ message: "Failed to add review" });
            }
        })
        // user bsed reviews
        app.get('/reviews/user/:email', async (req, res) => {
            const email = req.params.email;
            try {
                const reviews = await reviewsCollection.find({email}).toArray();
                res.send(reviews)
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        })

        // update review by specific user 
        app.put('/reviews/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedReview = req.body;
            const result = await reviewsCollection.updateOne({_id: new ObjectId(id)}, {$set: updatedReview})
            res.send(result)
        })

        // review delete 
        app.delete('/reviews/delete/:id', async (req, res) => {
            const id = req.params.id;
            const result = await reviewsCollection.deleteOne({_id: new ObjectId(id)})
            res.send(result)
        })

        app.post('/user/add/service', async (req, res) => {
            const serviceData = req.body;
            // console.log(serviceData);
            const result = await serviceCollection.insertOne(serviceData);
            res.send(result)
        })
        // limited service view 
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find().sort({addedDate: -1}).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })

        // Rating add for a service 
        app.post('/services/rating/:id', async (req, res) => {
            const serviceId = req.params.id;
            // const {rating } = req.body;
            const { review, rating, reviewDate, photo, Name, email } = req.body;
            console.log(review, rating, reviewDate, photo, Name, email);
            if(rating< 1 || rating > 5){
                return res.status(400).send({message: "Rating should be 1 and 5"})
            }
            try {
                const service = await serviceCollection.findOne({_id:new ObjectId(serviceId)});
                if(!service){
                    return res.status(404).send({message: "Service not found"})
                }
                const updatedRatings = [...(service.ratings || []), {review, rating, reviewDate, photo, Name, email}];
                const result = await serviceCollection.updateOne(
                    {_id: new ObjectId(serviceId)},
                    {$set: {ratings: updatedRatings}}
                )
                res.status(200).send({message: "Rating addd successfully!", result})
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error adding rating." });
            }
        })
        // all services page 
        app.get('/all/services', async (req, res) => {

            const result = await serviceCollection.find().toArray();
            res.send(result)
        })

        // details page 
        app.get('/services/details/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send('Service Review System is running')
})

app.listen(port, () => {
    console.log(`review is waiting :${port}`)
})