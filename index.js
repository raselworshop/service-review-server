const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const tokenVerify = async (req, res, next) => {
    console.log('from token verify', req.cookies);
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: "unauthorized access!" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized access prohabitted!" })
        }
        req.user = decode;
        next();
    })
}


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

        // auth related 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false
                })
                .send({ success: true })
        })
        app.post('/signout', (req, res)=>{
            res.clearCookie('token', {
                httpOnly:true,
                secure:false,
            })
            .send({success:true})
        })
        // reviews releted 
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            // console.log(review, "review posting")
            // if already reviewed 
            const query = { email: review.email, serviceId: review.serviceId }
            const aleardyExist = await reviewsCollection.findOne(query)
            if (aleardyExist) return res.status(400).send({ message: "You have already given review" })
            console.log("Already exist", aleardyExist)
            try {
                const newReview = {
                    review: review.review,
                    rating: review.rating,
                    reviewDate: review.reviewDate,
                    serviceTitle: review.serviceTitle,
                    photo: review.photo,
                    Name: review.Name,
                    email: review.email,
                    serviceId: review.serviceId,
                    _id: new ObjectId(),
                };
                const result = await reviewsCollection.insertOne(newReview)

                const service = await serviceCollection.findOne({ _id: new ObjectId(newReview.serviceId) })
                if (service) {
                    const updatedRatings = [...(service.ratings || []), {
                        review: review.review,
                        rating: review.rating,
                        reviewDate: review.reviewDate,
                        photo: review.photo,
                        Name: review.Name,
                        email: review.email,
                        _id: new ObjectId(),
                        serviceId: review.serviceId,
                    }];
                    const updatedResult = await serviceCollection.updateOne(
                        { _id: new ObjectId(newReview.serviceId) },
                        { $set: { ratings: updatedRatings } }
                    )
                    // console.log("Updated result is here",updatedResult)
                }
                // console.log("this is service",service)
                res.status(201).send(result)
            } catch (error) {
                res.status(500).send({ message: "Failed to add review" });
            }
        })
        // user bsed reviews
        app.get('/reviews/user/:email', tokenVerify, async (req, res) => {
            const email = req.params.email;
            if(req.user.email !== email){
                return res.status(403).send({message:"fobidden access"})
            }
            try {
                const reviews = await reviewsCollection.find({ email }).toArray();
                res.send(reviews)
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        })

        // update review by specific user 
        app.put('/reviews/update/:id', async (req, res) => {
            const { id: reviewId } = req.params;
            const updatedReview = req.body;

            try {
                // upadte the revwe 
                const review = await reviewsCollection.findOne(
                    { _id: new ObjectId(reviewId) }
                )
                if (!review) return res.status(404).send({ message: "Review not found" })
                const service = await serviceCollection.findOne({ _id: new ObjectId(review.serviceId) })
                if (service) {
                    // find review to update 
                    const updatedRatings = service.ratings.map(rating => {
                        if (rating._id && reviewId && rating._id === reviewId) {
                            // update review data 
                            return {
                                ...rating,
                                review: updatedReview.review,
                                rating: updatedReview.rating,
                                reviewDate: updatedReview.reviewDate,
                            }
                        }
                        return rating;
                    })
                    await serviceCollection.updateOne(
                        { _id: new ObjectId(review.serviceId) },
                        { $set: { ratings: updatedRatings } }
                    )
                }

                const result = await reviewsCollection.updateOne(
                    { _id: new ObjectId(reviewId) },
                    { $set: updatedReview }
                );
                if (!result) {
                    return res.status(404).send({ message: "Review not found" });
                }
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to update review" });
            }
        });
        // review delete 
        // app.delete('/reviews/delete/:id', async (req, res) => {
        //     const reviewId = req.params.id;
        //     try {
        //         const result = await reviewsCollection.deleteOne({ _id: new ObjectId(reviewId) });
        //         res.send(result);
        //     } catch (error) {
        //         res.status(500).send({ message: "Failed to delete review" });
        //     }
        // });
        app.delete('/reviews/delete/:id', async (req, res) => {
            const reviewId = req.params.id;

            try {
                const reviewToDelete = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });

                if (!reviewToDelete) {
                    return res.status(404).send({ message: "Review not found" });
                }

                const service = await serviceCollection.findOne({ _id: new ObjectId(reviewToDelete.serviceId) });
                if (service) {
                    const updatedRatings = service.ratings.filter(rating => rating._id !== reviewId);

                    await serviceCollection.updateOne(
                        { _id: new ObjectId(reviewToDelete.serviceId) },
                        { $set: { ratings: updatedRatings } }
                    );
                }

                const result = await reviewsCollection.deleteOne({ _id: new ObjectId(reviewId) });

                if (result.deletedCount === 1) {
                    res.status(200).send({ message: "Review and corresponding rating deleted successfully" });
                } else {
                    res.status(404).send({ message: "Review not found" });
                }
                console.log('Deleting review with ID:', reviewId);

            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to delete review and update ratings" });
            }
        });
        // get services by a specific user 
        app.get('/services/user/:email',tokenVerify, async (req, res) => {
            const email = req.params.email;
            if(req.user.email !== email){
                return res.status(403).send({message:"fobidden access"})
            }
            console.log("cookies", req.cookies)
            try {
                const services = await serviceCollection.find({ userEmail: email }).toArray();
                res.send(services)
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        })
        app.post('/user/add/service', async (req, res) => {
            const serviceData = req.body;
            // console.log(serviceData);
            const result = await serviceCollection.insertOne(serviceData);
            res.send(result)
        })
        // limited service view 
        app.get('/services/limited', async (req, res) => {
            const cursor = serviceCollection.find().sort({ addedDate: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })
        // implement to categoriesed
        app.get('/services', tokenVerify, async (req, res) => {
            const { category } = req.query;
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            console.log("from pagination services", req.query)
            let query = {};
            if (category && category !== 'All') {
                query = { category: { $regex: category, $options: 'i' } };
                // query = { category: new RegExp(category, 'i') };
                console.log("Request received with query:", { category })
            }

            try {
                const services = await serviceCollection.find(query)
                .skip(page * size)
                .limit(size)
                .toArray();
                res.send(services);
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch services' });
            }
        });
        app.get('/categories', async (req, res) => {
            try {
                // Use aggregate to fetch distinct categories
                const categories = await serviceCollection.aggregate([
                    { $group: { _id: "$category" } }
                ]).toArray();
                const categoryList = categories.map(cat => cat._id);
                res.send(categoryList);
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch categories' });
            }
        });
        // pagination 
        app.get('/servicesCount', async (req, res) => {
            const count = await serviceCollection.estimatedDocumentCount();
            res.send({count})
        })
        // from navbar search 
        app.get('/services/search', async (req, res) => {
            const { query } = req.query;
            let searchQuery = {};
            if (query) {
                searchQuery = {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { category: { $regex: query, $options: "i" } },
                        { companyName: { $regex: query, $options: "i" } },
                    ]
                }
            }
            try {
                const services = await serviceCollection.find(searchQuery).toArray();
                res.send(services)
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch services' });
            }
        })
        // service updating 
        app.put('/services/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatedService = req.body;
            try {
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: updatedService
                }
                console.log("Updating service with ID:", id);
                console.log("Update Data:", updatedService);
                const result = await serviceCollection.updateOne(query, update);
                console.log("Result is from update", result)
                res.send(result)
            } catch (error) {
                console.error("Error updating service:", error);
                res.status(500).send({ message: "Failed to update service" });
            }
        })
        // service deleting 
        app.delete('/services/delete/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) }
                const result = await serviceCollection.deleteOne(query)
                res.send(result)
            } catch (error) {
                console.error('Error deleting service:', error);
                res.status(500).send({ message: 'Internal Server Error' });
            }
        })

        // Rating add for a service 
        app.post('/services/rating/:id', async (req, res) => {
            const serviceId = req.params.id;
            // const {rating } = req.body;
            const { review, rating, reviewDate, photo, Name, email } = req.body;
            console.log(review, rating, reviewDate, photo, Name, email);
            if (rating < 1 || rating > 5) {
                return res.status(400).send({ message: "Rating should be 1 and 5" })
            }
            try {
                const service = await serviceCollection.findOne({ _id: new ObjectId(serviceId) });
                if (!service) {
                    return res.status(404).send({ message: "Service not found" })
                }
                const updatedRatings = [...(service.ratings || []), { review, rating, reviewDate, photo, Name, email }];
                const result = await serviceCollection.updateOne(
                    { _id: new ObjectId(serviceId) },
                    { $set: { ratings: updatedRatings } }
                )
                res.status(200).send({ message: "Rating addd successfully!", result })
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error adding rating." });
            }
        })
        // all services page 
        // app.get('/all/services', async (req, res) => {

        //     const result = await serviceCollection.find().toArray();
        //     res.send(result)
        // })

        // details page 
        app.get('/services/details/:id', tokenVerify, async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const email = req.query.email;
            if(req.user.email !== email){
                return res.status(403).send({message:"fobidden access"})
            }
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