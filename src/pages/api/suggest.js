

import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        const response = await axios.get("https://suggestqueries.google.com/complete/search", {
            params: { client: "firefox", q: query },
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch suggestions" });
    }
}
