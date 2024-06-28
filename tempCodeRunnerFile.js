router.get('/destinations', async (req, res) => {
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