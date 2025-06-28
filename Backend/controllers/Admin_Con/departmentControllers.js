import Department from "../../models/departmentModel.js";
import User from "../../models/userModel.js";

export const createDepartment = async (req, res) => {
    try{
        const { name, description} =req.body;

        // Validate required fields
        if(!name){
            return res.status(400).json({ error: "Name of department is required" });
        }

        // Check if department already exists
        const existingDepartment = await Department.findOne({ name});

        if(existingDepartment){
            return res.status(400).json({ error: "Department already exists" });
        }

            // Validate headOfDepartment exists
            // const headUser = await User.findById(headOfDepartment);
            // if (!headUser) {
            // return res.status(404).json({ error: "Head of Department not found." });
            // }

            // Create new department
            const newDepartment = new Department({
                name,
                description,
                // headOfDepartment,
                // members
            });

            await newDepartment.save();
            res.status(201).json({
                message: "Department created successfully", 
                department: newDepartment
            });

    }catch(error){
        console.error("Error creating department:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.status(200).json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getDepartmentById = async (req, res) => {
    const { id } = req.params;

    try {
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }
        res.status(200).json(department);
    } catch (error) {
        console.error("Error fetching department:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        // Update fields
        if (name) department.name = name;
        if (description) department.description = description;

        await department.save();
        res.status(200).json({
            message: "Department updated successfully",
            department
        });
    } catch (error) {
        console.error("Error updating department:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        const department = await Department.findByIdAndDelete(id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }


        res.status(200).json({
            message: "Department deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting department:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

