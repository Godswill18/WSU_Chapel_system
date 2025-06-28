import Calendar from "../../models/calendarModel.js";

export const createChapelEvent = async (req, res) => {
    try{

        const { title, description, startDate, endDate, location } = req.body;

        // Validate required fields
        if (!title || !description || !startDate || !endDate || !location) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Validate date formats
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Check if start date is before end date
        if (start > end) {
            return res.status(400).json({ error: "Start date must be before end date" });
        }

        // Create the event
        const newEvent = new Calendar({
            title,
            description,
            startDate: start,
            endDate: end,
            location
        });

        await newEvent.save();
        res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });

    }catch(error){
        console.error("Error creating event:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getChapelEvents = async (req, res) => {
    try {
        const events = await Calendar.find().sort({ startDate: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getEventById = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Calendar.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateChapelEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, startDate, endDate, location } = req.body;

    try {
        const event = await Calendar.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Update fields
        if (title) event.title = title;
        if (description) event.description = description;
        if (startDate) event.startDate = new Date(startDate);
        if (endDate) event.endDate = new Date(endDate);
        if (location) event.location = location;

        await event.save();
        res.status(200).json({
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        console.error("Error updating event:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteChapelEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Calendar.findByIdAndDelete(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}