import Calendar from "../../models/calendarModel.js";

export const createChapelEvent = async (req, res) => {
    try {
        const { title, date, time, location, type, description, organizer, attendees } = req.body;

        // Validate required fields
        if (!title || !date || !time || !location || !type || !description || !organizer) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Validate date format
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Create the event
        const newEvent = new Calendar({
            title,
            date: eventDate,
            time,
            location,
            type,
            description,
            organizer,
            attendees: attendees || []  // default to empty array if not provided
        });

        await newEvent.save();
        res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });

    } catch (error) {
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
    const { title, date, time, location, type, description, organizer, attendees } = req.body;

    try {
        const event = await Calendar.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Update fields
        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = new Date(date);
        if (time) event.time = time;
        if (type) event.type = type;
        if (location) event.location = location;
        if (organizer) event.organizer = organizer;
        if (attendees) event.attendees = attendees;

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