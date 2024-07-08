import express from "express";
import session from "express-session";
import 'dotenv/config';
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import fs from 'fs';
import passport from "passport";
import { Strategy } from "passport-local";
import { name } from "ejs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Set up middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.use(passport.initialize());
app.use(passport.session());

const testimonials = [
    {
        reviews: "dgsdjhgdjgsadjasgdjasdgajd",
        name: "Wood"
    },
    {
        reviews: "dgsdjhgdjgsadjasgdjasdgajd",
        name: "Mark"
    },
    {
        reviews: "dgsdjhgdjgsadjasgdjasdgajd",
        name: "Maxwell"
    }
];

app.get('/admin', (req, res) => {
    res.render("admin.ejs");
});

app.get('/hotels', async (req, res) => {
    try {
        // Query to fetch all hotel information from the database
        const query = `
            SELECT *
            FROM hotels;
        `;
        
        // Execute the query
        const result = await db.query(query);
        const hotels = result.rows;

        const queryDestinations = `
            SELECT destination_id, name
            FROM destinations;
        `;

        // Execute the query to fetch destinations
        const resultDestinations = await db.query(queryDestinations);
        const destinations = resultDestinations.rows;

        // Send the retrieved hotel information as a JSON response
        res.render("hotelAdmin.ejs", { hotels: hotels, destinations: destinations });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ error: 'Error fetching hotels' });
    }
});

app.post('/hotels', async (req, res) => {
    const { name, description, image_url, price, detailed_description, destination_id } = req.body;
    try {
        // Construct the image URL
        let imageUrlToUpdate = '/images/' + image_url;

        // Use a SQL query to insert the data into the hotels table
        const query = `
            INSERT INTO hotels (name, description, image_url, price, detailed_description, destination_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        // Execute the query with the provided data
        const { rows } = await db.query(query, [name, description, imageUrlToUpdate, price, detailed_description, destination_id]);

        // Send a success response with the inserted hotel
        res.redirect("/hotels");
        // res.status(201).json({ message: 'Hotel added successfully', hotel: rows[0] });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error adding new hotel:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error adding new hotel. Please try again later.' });
    }
});

app.get('/hotels/:hotel_id', async (req, res) => {
    try {
        const hotelId = req.params.hotel_id;

        // Query to fetch the details of the hotel based on its ID
        const queryHotel = `
            SELECT *
            FROM hotels
            WHERE hotel_id = $1;
        `;

        // Execute the query to fetch hotel details
        const resultHotel = await db.query(queryHotel, [hotelId]);
        const hotel = resultHotel.rows[0]; // Assuming only one hotel is returned

        // Render the form for editing the hotel with the retrieved data
        res.render("modifyHotel.ejs", { hotelId: hotelId, hotel });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        res.status(500).json({ error: 'Error fetching hotel details' });
    }
});

app.post('/edit/hotels/:hotel_id', async (req, res) => {
    const hotelId = req.params.hotel_id;
    console.log(req.body);
    const { name, description, image_url, price, detailed_description } = req.body;

    try {
        let imageUrlToUpdate = '';

        // Check if there is an image_url field in req.body
        if (image_url) {
            // If there is, set the image URL to the provided image path
            imageUrlToUpdate = '/images/' + image_url;
        } else {
            // If not, keep the existing image URL in the database
            const queryGetImage = 'SELECT image_url FROM hotels WHERE hotel_id = $1';
            const result = await db.query(queryGetImage, [hotelId]);

            // Check if the query returned a result
            if (result.rows.length === 0) {
                return res.status(404).send('Hotel not found');
            }

            // Set the image URL to the existing image path fetched from the database
            imageUrlToUpdate = result.rows[0].image_url;
        }

        const query = `
            UPDATE hotels
            SET name = $1, description = $2, image_url = $3, price = $4, detailed_description = $5
            WHERE hotel_id = $6
        `;
        const values = [name, description, imageUrlToUpdate, price, detailed_description, hotelId];
        await db.query(query, values);

        res.redirect("/hotels");
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/delete/hotels/:hotel_id', async (req, res) => {
    const hotelId = req.params.hotel_id;

    try {
        // Use a SQL query to delete the hotel from the hotels table
        const query = `
            DELETE FROM hotels
            WHERE hotel_id = $1;`;

        // Execute the query with the provided hotel ID
        await db.query(query, [hotelId]);

        // Send a success response
        res.redirect("/hotels");
        // res.status(200).json({ message: 'Hotel deleted successfully' });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error deleting hotel:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error deleting hotel. Please try again later.' });
    }
});



app.get('/attractions', async (req, res) => {
    try {
        // Query to fetch all destination information from the database
        const query = `
            SELECT *
            FROM attractions;
        `;
        
        // Execute the query
        const result = await db.query(query);
        const attr = result.rows;

        const queryDestinations = `
            SELECT destination_id, name
            FROM destinations;
        `;

        // Execute the query to fetch destinations
        const resultDestinations = await db.query(queryDestinations);
        const destinations = resultDestinations.rows;

        // Send the retrieved destination information as a JSON response
        res.render("attractionAdmin.ejs", { attraction: attr, destinations: destinations});
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({ error: 'Error fetching destinations' });
    }
});

app.post('/attractions', async (req, res) => {
    const { name, description, image_url, price, detailed_description, destination_id } = req.body;
    try {
        
        let imageUrlToUpdate = '/images/' + image_url;
        // Use a SQL query to insert the data into the attractions table
        const query = `
            INSERT INTO attractions (name, description, image_url, price, detailed_description, destination_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;`;

        // Execute the query with the provided data
        const { rows } = await db.query(query, [name, description, imageUrlToUpdate, price, detailed_description, destination_id]);

        // Send a success response with the inserted attraction
        res.redirect("/attractions");
        // res.status(201).json({ message: 'Attraction added successfully', attraction: rows[0] });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error adding new attraction:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error adding new attraction. Please try again later.' });
    }
});


// GET route to render the form for editing an attraction
app.get('/attractions/:attraction_id', async (req, res) => {
    try {
        const attractionId = req.params.attraction_id;

        // Query to fetch the details of the attraction based on its ID
        const queryAttraction = `
            SELECT *
            FROM attractions
            WHERE attraction_id = $1;
        `;

        // Execute the query to fetch attraction details
        const resultAttraction = await db.query(queryAttraction, [attractionId]);
        const attraction = resultAttraction.rows[0]; // Assuming only one attraction is returned

        // Render the form for editing the attraction with the retrieved data
        res.render("modifyAttr.ejs", { attractionId: attractionId, attraction});
    } catch (error) {
        console.error('Error fetching attraction details:', error);
        res.status(500).json({ error: 'Error fetching attraction details' });
    }
});


app.post('/edit/attractions/:attraction_id', async (req, res) => {
    const attractionId = req.params.attraction_id;
    console.log(req.body);
    const { name, description, image_url, price, detailed_description } = req.body;

    try {
        let imageUrlToUpdate = '';

        // Check if there is an image field in req.body
        if (image_url) {
            // If there is, set the image URL to the provided image path
            imageUrlToUpdate = '/images/' + image_url;
        } else {
            // If not, keep the existing image URL in the database
            const queryGetImage = 'SELECT image_url FROM attractions WHERE attraction_id = $1';
            const result = await db.query(queryGetImage, [attractionId]);

            // Check if the query returned a result
            if (result.rows.length === 0) {
                return res.status(404).send('Attraction not found');
            }

            // Set the image URL to the existing image path fetched from the database
            imageUrlToUpdate = result.rows[0].image_url;
        }

        const query = `
            UPDATE attractions
            SET name = $1, description = $2, image_url = $3, price = $4, detailed_description = $5
            WHERE attraction_id = $6
        `;
        const values = [name, description, imageUrlToUpdate, price, detailed_description, attractionId];
        await db.query(query, values);

        res.redirect("/attractions");
    } catch (error) {
        console.error('Error updating attraction:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/delete/attractions/:attraction_id', async (req, res) => {
    const attractionId = req.params.attraction_id;

    try {
        // Use a SQL query to delete the attraction from the attractions table
        const query = `
            DELETE FROM attractions
            WHERE attraction_id = $1;`;

        // Execute the query with the provided attraction ID
        await db.query(query, [attractionId]);

        // Send a success response
        res.redirect("/attractions");
        // res.status(200).json({ message: 'Attraction deleted successfully' });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error deleting attraction:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error deleting attraction. Please try again later.' });
    }
});




app.get('/destinations', async (req, res) => {
    try {
        // Query to fetch all destination information from the database
        const query = `
            SELECT *
            FROM destinations;
        `;
        
        // Execute the query
        const result = await db.query(query);
        const dest = result.rows;

        // Send the retrieved destination information as a JSON response
        res.render("destinationAdmin.ejs", { destinations: dest });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({ error: 'Error fetching destinations' });
    }
});

app.get('/destinations/:destination_id', async (req, res) => {
    const destinationId = req.params.destination_id;

    try {
        // Fetch destination details from the database
        const query = 'SELECT name, description, image_url FROM destinations WHERE destination_id = $1';
        const values = [destinationId];
        const result = await db.query(query, values);

        // Check if a destination with the provided ID exists
        if (result.rows.length === 0) {
            return res.status(404).send('Destination not found');
        }

        // Extract name and description from the query result
        const { name, description, image_url} = result.rows[0];
        // console.log(name, description, image_url);
        // const imageUrlAfterImages = image_url.substring(image_url.indexOf('/images/') + '/images/'.length);
        // console.log(imageUrlAfterImages);

        // Render modifyDest.ejs and pass destination details to it
        res.render('modifyDest.ejs', { destinationId: destinationId, name: name, description: description, image_url: image_url });
    } catch (error) {
        console.error('Error fetching destination:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/edit/destinations/:destination_id', async (req, res) => {
    const destinationId = req.params.destination_id;
    console.log(req.body);
    const { name, description, image } = req.body;

    try {
        let imageUrlToUpdate = '';

        // Check if there is an image field in req.body
        if (image) {
            // If there is, set the image URL to the provided image path
            imageUrlToUpdate = '/images/' + image;
        } else {
            // If not, keep the existing image URL in the database
            const queryGetImage = 'SELECT image_url FROM destinations WHERE destination_id = $1';
            const result = await db.query(queryGetImage, [destinationId]);

            // Check if the query returned a result
            if (result.rows.length === 0) {
                return res.status(404).send('Destination not found');
            }

            // Set the image URL to the existing image path fetched from the database
            imageUrlToUpdate = result.rows[0].image_url;
        }

        const query = `
            UPDATE destinations
            SET name = $1, description = $2, image_url = $3
            WHERE destination_id = $4
        `;
        const values = [name, description, imageUrlToUpdate, destinationId];
        await db.query(query, values);

        res.redirect("/destinations");
    } catch (error) {
        console.error('Error updating destination:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/destinations', async (req, res) => {
    const { name, description, tags, image_url } = req.body;
    console.log(image_url);

    try {
        let imageUrlToUpdate = '/images/' + image_url;
        // Ensure tags is an array
        const tagsArray = Array.isArray(tags) ? tags : [tags];

        // Use a SQL query to insert the data into the destinations table
        const query = `
            INSERT INTO destinations (name, description, tags, location, image_url)
            VALUES ($1, $2, $3, 'Pakistan', $4)
            RETURNING *;`;

        // Execute the query with the provided data
        const { rows } = await db.query(query, [name, description, tagsArray, imageUrlToUpdate]);

        // Send a success response with the inserted destination
        res.redirect("/destinations");
        // res.status(201).json({ message: 'Destination added successfully', destination: rows[0] });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error adding new destination:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error adding new destination. Please try again later.' });
    }
});

app.post('/delete/destinations/:destination_id', async (req, res) => {
    const destinationId = req.params.destination_id;

    try {
        // Use a SQL query to delete the destination from the destinations table
        const query = `
            DELETE FROM destinations
            WHERE destination_id = $1;`;

        // Execute the query with the provided destination ID
        await db.query(query, [destinationId]);

        // Send a success response
        res.redirect("/destinations");
        // res.status(200).json({ message: 'Destination deleted successfully' });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error deleting destination:', error);
        // Send an error response with an appropriate error message
        res.status(500).json({ error: 'Error deleting destination. Please try again later.' });
    }
});

app.post("/write-review", async (req, res) => {
    try {
        // Extract data from the form submission
        const { rating, comment, attId } = req.body;
        console.log("Rating:", rating);
        console.log("Review: ", comment);

        // Check if the user is authenticated
        if (req.isAuthenticated()) {
            console.log("User ID:", req.user.user_id);
            // If user is authenticated, redirect to details page
            return res.redirect(`/details?attractionId=${attId}`);
        }

        // If user is not authenticated, redirect to login page with 'from' and 'type' parameters
        return res.redirect(`/login?from=review&type=attraction&attId=${attId}`);
    } catch (error) {
        console.error("Error processing review:", error);
        res.status(500).send("Error processing review");
    }
});

app.post("/write-review-hotel", async (req, res) => {
    try {
        // Extract data from the form submission
        const { rating, comment, hotelId } = req.body;
        console.log("Rating:", rating);
        console.log("Review: ", comment);

        // Check if the user is authenticated
        if (req.isAuthenticated()) {
            console.log("User ID:", req.user.user_id);
            // If user is authenticated, redirect to hotel details page
            return res.redirect(`/hotelDetails?hotelId=${hotelId}`);
        }

        // If user is not authenticated, redirect to login page with 'from' and 'type' parameters
        return res.redirect(`/login?from=review&type=hotel&hotelId=${hotelId}`);
    } catch (error) {
        console.error("Error processing review:", error);
        res.status(500).send("Error processing review");
    }
});


app.get("/login", (req, res) => {
    const from = req.query.from || null;
    let attId = null;
    let hotelId = null;
    let type = null;

    // Check if attId exists
    if (req.query.attId) {
        attId = req.query.attId;
        type = "attraction"; // Set type to 'attraction' if attId exists
    } else if (req.query.hotelId) { // Check if hotelId exists
        hotelId = req.query.hotelId;
        type = "hotel"; // Set type to 'hotel' if hotelId exists
    }

    if (from !== null && (attId !== null || hotelId !== null)) {
        console.log("From:", from);
        console.log(type === "attraction" ? "AttId:" : "HotelId:", type === "attraction" ? attId : hotelId);
    }
    
    res.render("login.ejs", { from, attId, hotelId, type }); // Pass attId, hotelId, and type to the template if they exist
});



app.post("/login", (req, res) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("Error authenticating user:", err);
            return res.redirect("/login");
        }
        if (!user) {
            return res.redirect("/login");
        }
        req.login(user, (err) => {
            if (err) {
                console.error("Error logging in:", err);
                return res.redirect("/login");
            }
            // Retrieve the 'from' parameter from the request body
            const from = req.body.from;
            const attId = req.body.attId;
            const hotelId = req.body.hotelId;
            console.log(req.user.user_id);
            
            if (from === "confirm") {
                req.session.cart = [];
                req.session.cartItemCount = 0;
                res.redirect("/");
            } else if (from === "review") {
                // Redirect to the details page based on type (attraction or hotel)
                if (attId) {
                    console.log("You are in Review for attraction:", attId);
                    res.redirect(`/details?attractionId=${attId}`);
                } else if (hotelId) {
                    console.log("You are in Review for hotel:", hotelId);
                    res.redirect(`/hotelDetails?hotelId=${hotelId}`);
                } else {
                    return res.redirect("/");
                }
            } else {
                return res.redirect("/");
            }
        });
    })(req, res);
});


app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/logout", (req, res) => {
    // Clear the login session
    req.logout(req.user, (err) => {
        if (err) {
            console.error("Error logging out:", err);
            res.status(500).send("Error logging out");
        } else {
            // Destroy the session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error clearing session:", err);
                    res.status(500).send("Error logging out");
                } else {
                    console.log("Session cleared successfully");
                    res.redirect("/"); // Redirect to the home page or any other appropriate page
                }
            });
        }
    });
});

app.post("/register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/login");
      } else {
        const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
          [email, password] // Assuming passwords are already hashed
        );
        const user = result.rows[0];
        req.login(user, (err) => {
          console.log("success");
          res.redirect("/");
        });
      }
    } catch (err) {
      console.log(err);
    }
});

app.get('/currentHappenings', async (req, res) => {
    try {
        // Query to retrieve current happenings
        const query = `
            SELECT ch.happening_id, ch.event_name, ch.event_description, ch.event_date,
                   d.name AS destination_name
            FROM currentHappenings ch
            JOIN destinations d ON ch.destination_id = d.destination_id;
        `;
        
        // Execute the query
        const result = await db.query(query);
        const happenings = result.rows;

        res.render('currentHappenings.ejs', { happenings: happenings,  user: req.user});
        // Send the retrieved data as JSON response
    } catch (error) {
        console.error('Error fetching current happenings:', error);
        res.status(500).json({ error: 'Error fetching current happenings' });
    }
});

app.get('/currentDeals', async (req, res) => {
    try {
      // Query to retrieve package details
      const query = `
        SELECT p.package_id, p.name AS package_name, p.description AS package_description, 
               p.price AS package_price, p.image_url AS package_image_url, 
               d.name AS destination_name, d.description AS destination_description,
               d.location AS destination_location,
               h.name AS hotel_name, h.description AS hotel_description, h.location AS hotel_location,
               a.name AS attraction_name, a.description AS attraction_description, a.image_url AS attraction_image_url
        FROM packages p
        JOIN destinations d ON p.destination_id = d.destination_id
        JOIN hotels h ON p.hotel_id = h.hotel_id
        JOIN attractions a ON p.attraction_ids[1] = a.attraction_id;
      `;
      
      // Execute the query
        const result = await db.query(query);
        const packages = result.rows;
  
      // Send the retrieved package details to package.ejs
      res.render('package.ejs', { packages: packages,  user: req.user});
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ error: 'Error fetching packages' });
    }
  });

app.get("/", async (req, res) => {
    try {
        // Fetch destinations from the database
        const result = await db.query("SELECT * FROM destinations ORDER BY average_rating DESC LIMIT 4");
        const destinations = result.rows;
        
        // Pass the 'user' variable to the template
        res.render("home.ejs", { datas: destinations, reviews: testimonials, cartCount: req.session.cartItemCount || 0, user: req.user });
    } catch (error) {
        console.error("Error fetching destinations:", error);
        res.status(500).send("Error fetching destinations");
    }    
});



app.get("/home", (req, res) => {
    res.redirect("/");
});

//all destinations
app.get("/destinationPage", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM destinations");
        const destinations = result.rows;
        res.render("destinationPage.ejs", { datas: destinations,  cartCount: req.session.cartItemCount || 0, user: req.user});
    } catch (error) {
        console.error("Error fetching destinations:", error);
        res.status(500).send("Error fetching destinations");
    }
});

app.get("/hotelPage", async (req, res) => {
    try {
        // Fetch destination names and IDs
        const destinationResult = await db.query("SELECT destination_id, name FROM destinations");
        const destinations = destinationResult.rows;

        let hotels;

        // Check if there's a destination filter applied
        if (req.query.destination && req.query.destination !== 'all') {
            // If there's a destination filter, fetch hotels based on the selected destination
            const result = await db.query("SELECT * FROM hotels WHERE destination_id = $1", [req.query.destination]);
            hotels = result.rows;
        } else {
            // If no destination filter, fetch all hotels
            const result = await db.query("SELECT * FROM hotels");
            hotels = result.rows;
        }

        res.render("hotelPage.ejs", { datas: hotels, destinations: destinations, cartCount: req.session.cartItemCount || 0, user: req.user });
    } catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).send("Error fetching hotels");
    }
});


//filter the destinations
app.post("/filter", async (req, res) => {
    const selectedRating = req.body.rating;
    const selectedTag = req.body.tag;
    const selectedPrice = req.body.price;

    try {
        let query = "SELECT * FROM destinations WHERE 1=1";

        if (selectedRating !== "all") {
            query += ` AND average_rating >= ${parseFloat(selectedRating)}`;
        }

        if (selectedTag !== "all") {
            query += ` AND '${selectedTag}' = ANY (tags)`;
        }

        const result = await db.query(query);
        const filteredDestinations = result.rows;

        res.render("destinationPage.ejs", { datas: filteredDestinations,  cartCount: req.session.cartItemCount || 0, user: req.user});
    } catch (error) {
        console.error("Error filtering destinations:", error);
        res.status(500).send("Error filtering destinations");
    }
});

app.get("/filterHotels", async (req, res) => {
    const selectedDestinationId = req.query.destination;

    try {
        // Query destinations table to get destination IDs and names
        const destinationQuery = "SELECT destination_id, name FROM destinations";
        const destinationResult = await db.query(destinationQuery);
        const destinations = destinationResult.rows;

        let query = `
            SELECT hotels.*
            FROM hotels
            JOIN destinations ON hotels.destination_id = destinations.destination_id
            WHERE 1=1`;

        if (selectedDestinationId !== "all") {
            query += ` AND destinations.destination_id = $1`;
        }

        const values = selectedDestinationId !== "all" ? [parseInt(selectedDestinationId)] : [];

        const result = await db.query(query, values);
        const filteredHotels = result.rows;

        res.render("hotelPage.ejs", { 
            datas: filteredHotels, 
            destinations: destinations, // Pass destinations data to the template
            cartCount: req.session.cartItemCount || 0, 
            user: req.user
        });
    } catch (error) {
        console.error("Error filtering hotels:", error);
        res.status(500).send("Error filtering hotels");
    }
});

app.get("/hotelDetails", async (req, res) => {
    const hotelId = req.query.hotelId; // Access hotelId from query parameters

    try {
        const query = `
        SELECT 
            h.hotel_id,
            h.name,
            h.description,
            h.detailed_description,
            h.image_url,
            h.price,
            hr.review_id,
            hr.user_id,
            hr.comment,
            hr.rating
        FROM 
            hotels AS h
        LEFT JOIN 
            hotelreviews AS hr ON h.hotel_id = hr.hotel_id
        WHERE 
            h.hotel_id = $1`;

        const values = [hotelId];
        const result = await db.query(query, values);
        const hotelDetails = result.rows;

        res.render("hotelDetails.ejs", { datas: hotelDetails, cartCount: req.session.cartItemCount || 0, user: req.user });
    } catch (error) {
        console.error("Error fetching hotel details:", error);
        res.status(500).send("Error fetching hotel details");
    }
});

//explore attractions for each destinations
app.post("/explore", async (req, res) => {
    const destId = req.body.destinationId;

    try {
        const query = `
            SELECT 
                attractions.*, 
                ROUND(AVG(attractionreviews.rating)::numeric, 2) AS average_rating,
                destinations.name AS destination_name
            FROM 
                attractions 
                LEFT JOIN attractionreviews ON attractions.attraction_id = attractionreviews.attraction_id 
                LEFT JOIN destinations ON attractions.destination_id = destinations.destination_id 
            WHERE 
                attractions.destination_id = $1 
            GROUP BY 
                attractions.attraction_id, 
                destinations.name`;

        const attractionsResult = await db.query(query, [destId]);
        const attractions = attractionsResult.rows;
        // console.log(attractions);

        res.render("explore.ejs", { datas: attractions,  cartCount: req.session.cartItemCount || 0, user: req.user});
    } catch (error) {
        console.error("Error fetching attractions:", error);
        res.status(500).send("Error fetching attractions");
    }
});

//detail for each attraction
app.get("/details", async (req, res) => {
    let attId = req.query.attractionId; // Retrieve 'attractionId' from query parameters
    if (!attId) {
        // If 'attractionId' is not found in query parameters, check the request body
        attId = req.body.attractionId;
    }

    const query = `
    SELECT 
        a.attraction_id,
        a.name AS attraction_name,
        a.description AS short_description,
        a.detailed_description,
        a.image_url,
        a.price,
        ar.review_id,
        ar.user_id,
        ar.comment,
        ar.rating
    FROM 
        attractions AS a
    LEFT JOIN 
        attractionreviews AS ar ON a.attraction_id = ar.attraction_id
    WHERE 
        a.attraction_id = $1`;

    try {
        const result = await db.query(query, [attId]);
        const attractionDetails = result.rows;

        // Process the attraction details as needed
        res.render("details.ejs", { datas: attractionDetails, cartCount: req.session.cartItemCount || 0, user: req.user });
    } catch (error) {
        console.error("Error fetching attraction details:", error);
        // Handle the error appropriately
        res.status(500).send("Error fetching attraction details");
    }
});

// Implement /cart route to display cart items
app.get("/cart", (req, res) => {
    try {
        const cartItems = req.session.cart || [];
        const cartDetails = {};

        cartItems.forEach(item => {
            // Check if the item is an attraction
            if (item.attractionId) {
                // If it's an attraction, handle it accordingly
                const key = `${item.type}_${item.attractionId}`; // Use both type and ID as key
                if (!cartDetails[key]) {
                    cartDetails[key] = {
                        type: item.type,
                        id: item.attractionId,
                        name: item.attractionName,
                        price: item.attractionPrice,
                        quantity: item.quantity,
                        date: item.date || '',
                        note: item.note || ''
                    };
                } else {
                    cartDetails[key].quantity += item.quantity;
                }
            } else if (item.hotelId) {
                // If it's a hotel, handle it accordingly
                const key = `${item.type}_${item.hotelId}`; // Use both type and ID as key
                if (!cartDetails[key]) {
                    cartDetails[key] = {
                        type: item.type,
                        id: item.hotelId,
                        name: item.hotelName,
                        price: item.hotelPrice,
                        quantity: item.quantity,
                        bedrooms: item.bedrooms || 1,
                        checkInTime: item.checkInTime || '12:00',
                        checkOutTime: item.checkOutTime || '12:00',
                        persons: item.persons || 1
                    };
                } else {
                    cartDetails[key].quantity += item.quantity;
                }
            }
        });

        const cartItemList = Object.values(cartDetails);

        res.render("cart.ejs", { cartItems: cartItemList });
    } catch (error) {
        console.error("Error fetching cart items:", error);
        res.status(500).send("Error fetching cart items");
    }
});


let summaryDetails = {};

// Route to increase quantity of an item in the cart
app.post("/increase-quantity", (req, res) => {
    try {
        const { attractionId } = req.body;

        // Find the item in the cart
        const cartItem = req.session.cart.find(item => item.attractionId === attractionId);

        if (cartItem) {
            // Increase the quantity of the item
            cartItem.quantity += 1;
        }

        // Update the cart item count in session
        req.session.cartItemCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

        // Redirect back to the cart page
        res.redirect("/cart");
    } catch (error) {
        console.error("Error increasing quantity:", error);
        res.status(500).send("Error increasing quantity");
    }
});

// Route to add attractions to the cart
app.post("/add-to-cart", (req, res) => {
    try {
        const { attractionId, attractionName, attractionPrice, note, date, persons } = req.body;

        console.log("Adding attraction to cart. Attraction ID:", attractionId);

        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if an item with the same ID and type already exists in the cart
        const existingItemIndex = req.session.cart.findIndex(item => (item.attractionId === attractionId && item.type === 'attraction'));

        if (existingItemIndex !== -1) {
            // If the item already exists, increment its quantity
            req.session.cart[existingItemIndex].quantity += 1;
        } else {
            // If the item doesn't exist, add it to the cart
            req.session.cart.push({
                type: 'attraction', // Set type as 'attraction' for attraction items
                attractionId,
                attractionName,
                attractionPrice,
                quantity: 1,
                note,
                date
            });
        }

        // Update the cart item count
        req.session.cartItemCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

        res.redirect("/details?attractionId=" + attractionId);
    } catch (error) {
        console.error("Error adding attraction to cart:", error);
        res.status(500).send("Error adding attraction to cart");
    }
});

// Route to add hotels to the cart
app.post("/add-hotel-to-cart", (req, res) => {
    try {
        console.log("Request Body:", req.body); // Print req.body

        const { hotelId, hotelName, hotelPrice, type, bedrooms, checkInTime, checkOutTime, persons } = req.body;

        console.log("Adding hotel to cart. Hotel ID:", hotelId);

        if (!hotelId || !hotelName || !hotelPrice || !type) {
            throw new Error("Missing hotel data or type in request body");
        }

        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if an item with the same ID and type already exists in the cart
        const existingItem = req.session.cart.find(item => item.hotelId === hotelId && item.type === type);

        if (!existingItem) {
            // If the item doesn't exist, add it to the cart
            req.session.cart.push({
                type, // Use the provided type
                hotelId,
                hotelName,
                hotelPrice,
                bedrooms,
                checkInTime,
                checkOutTime,
                persons
            });

            // Update the cart item count
            req.session.cartItemCount = req.session.cart.length;
            console.log("Session Cart:", req.session.cart);
        } else {
            console.log("Hotel already exists in the cart.");
        }

        res.redirect("/hotelDetails?hotelId=" + hotelId);
    } catch (error) {
        console.error("Error adding hotel to cart:", error);
        res.status(500).send("Error adding hotel to cart");
    }
});

// Route to remove an item from the cart
app.get("/remove-item", (req, res) => {
    try {
        const { id, type } = req.query;
        
        if (req.session.cart && req.session.cart.length > 0) {
            req.session.cart = req.session.cart.filter(item => {
                if (type === "attraction") {
                    return item.attractionId !== id;
                } else if (type === "hotel") {
                    return item.hotelId !== id;
                }
            });

            req.session.cartItemCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
        }
        
        if (req.session.cartItemCount === 0) {
            return res.redirect("/");
        }
        res.redirect("/cart");
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).send("Error removing item from cart");
    }
});

// Summary route to handle both attractions and hotels
app.post("/summary", (req, res) => {
    try {
        const attractions = [];
        const hotels = [];

        // Iterate over each key in the request body
        Object.keys(req.body).forEach(key => {
            console.log("Processing key:", key); // Log the current key being processed

            // Check if the key corresponds to an attraction quantity
            if (key.startsWith("quantity_") && req.body[`attractionId_${key.split("_")[1]}`]) {
                const attractionId = key.split("_")[1];
                const attractionName = req.body[`attractionName_${attractionId}`];
                const attractionPriceStr = req.body[`attractionPrice_${attractionId}`].replace("$", "").trim();
                const attractionPrice = parseFloat(attractionPriceStr); // Correctly parse attraction price

                // Check if attractionPrice is a valid number
                if (isNaN(attractionPrice)) {
                    console.error(`Invalid attraction price for attraction ID ${attractionId}: ${attractionPriceStr}`);
                    throw new Error(`Invalid attraction price for attraction ID ${attractionId}`);
                }

                const quantity = parseInt(req.body[key]);
                const itemTotalPrice = attractionPrice * quantity;

                console.log("Attraction: ", attractionName);
                attractions.push({
                    attractionId,
                    attractionName,
                    attractionPrice,
                    quantity,
                    itemTotalPrice,
                    note: req.body[`note_${attractionId}`],
                    date: req.body[`date_${attractionId}`],
                });
            }
            // Check if the key corresponds to a hotel quantity
            else if (key.startsWith("bedrooms_") && req.body[`hotelId_${key.split("_")[1]}`]) {
                const hotelId = key.split("_")[1];
                const hotelName = req.body[`hotelName_${hotelId}`];
                const hotelPriceStr = req.body[`hotelPrice_${hotelId}`].replace("$", "").trim();
                const hotelPrice = parseFloat(hotelPriceStr); // Correctly parse hotel price

                // Check if hotelPrice is a valid number
                if (isNaN(hotelPrice)) {
                    console.error(`Invalid hotel price for hotel ID ${hotelId}: ${hotelPriceStr}`);
                    throw new Error(`Invalid hotel price for hotel ID ${hotelId}`);
                }

                const bedrooms = parseInt(req.body[key]);
                const itemTotalPrice = hotelPrice * bedrooms;

                console.log("Hotel: ", hotelName); // Log the hotel name
                hotels.push({
                    hotelId,
                    hotelName,
                    hotelPrice,
                    bedrooms,
                    itemTotalPrice,
                    checkInTime: req.body[`checkInTime_${hotelId}`],
                    checkOutTime: req.body[`checkOutTime_${hotelId}`],
                    persons: req.body[`persons_${hotelId}`]
                });
            }
        });

        const totalPrice = attractions.reduce((total, attraction) => total + attraction.itemTotalPrice, 0) +
                          hotels.reduce((total, hotel) => total + hotel.itemTotalPrice, 0);

        console.log("Attractions:", attractions);
        console.log("Hotels:", hotels);
        console.log("Total Price:", totalPrice);

        res.render("summary.ejs", { attractions, hotels, totalPrice }); // Pass attractions, hotels, and totalPrice to the summary template
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).send("Error processing order");
    }
});

app.get("/cart-item-count", (req, res) => {
    // Retrieve the cart item count from session and send it as response
    const cartItemCount = req.session.cartItemCount || 0;
    res.json({ count: cartItemCount });
});

// Route to confirm booking
app.post("/confirm", (req, res) => {
    if (req.isAuthenticated()) {
        // Clear the session cart after successful booking
        req.session.cart = [];
        req.session.cartItemCount = 0;

        console.log("Session Cart after confirmation:", req.session.cart);

        res.redirect("/");
    } else {
        res.redirect("/login?from=confirm");
    }
});

passport.use(
    new Strategy(async function verify(username, password, cb) {
        // console.log(username);
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [username]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
            const storedPassword = user.password;
          if (password === storedPassword) {
            // Password matches
            return cb(null, user);
          } else {
            // Password does not match
            return cb(null, false);
          }
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
        return cb(err);
      }
    })
  );
  
  passport.serializeUser((user, cb) => {
    cb(null, user.user_id); // Serialize user_id to the session
});

passport.deserializeUser(async (id, cb) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE user_id = $1", [id]);
        const user = result.rows[0];
        cb(null, user);
    } catch (err) {
        console.error('Error deserializing user:', err);
        cb(err);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});