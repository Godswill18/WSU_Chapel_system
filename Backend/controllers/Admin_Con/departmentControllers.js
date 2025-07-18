import Department from "../../models/departmentModel.js";
import User from "../../models/userModel.js";

export const createDepartment = async (req, res) => {
    try{
        const { name, description, color, icon} =req.body;

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
                color,
                icon
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

export const assignLeader = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { userId } = req.body;

    // Validate department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already a member, if not add them
    if (!department.members.includes(userId)) {
      department.members.push(userId);
    }

    // Set the user as the primary leader (first in leads array)
    department.leads = [userId, ...department.leads.filter(id => id.toString() !== userId)];

    await department.save();

    // Populate the updated department data
    const populatedDepartment = await Department.findById(departmentId)
      .populate('leads', 'firstName lastName email profileImg position')
      .populate('members', 'firstName lastName email profileImg position');

    res.status(200).json({
      message: "Leader assigned successfully",
      department: populatedDepartment
    });
  } catch (error) {
    console.error("Error assigning leader:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getAllUsersDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('leads', 'firstName lastName email profileImg position createdAt')
      .populate('members', 'firstName lastName email profileImg position createdAt');
      
    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getUserDepartments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access these departments' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Fetch departments and populate both lead and members
    const departments = await Department.find({
      $or: [
        { members: userId },
        { lead: userId }
      ]
    })
    .populate('leads', 'firstName lastName email profileImg position phoneNumber joinDate') // populate lead details
    .populate('members', 'firstName lastName email profileImg position phoneNumber joinDate') // populate members
    .lean();

    // Format departments
    const formattedDepartments = departments.map(dept => {
      const isLead = dept.leads && dept.leads._id === userId;

      return {
        _id: dept._id,
        name: dept.name,
        description: dept.description,
        color: dept.color,
        icon: dept.icon,
        isLead,
        position: isLead ? dept.leads.position : 'worker',
        joinDate: dept.createdAt,
        leads: dept.leads,
        members: dept.members, // now includes full user details
      };
    });

    res.status(200).json({
      success: true,
      count: formattedDepartments.length,
      data: formattedDepartments
    });

  } catch (error) {
    console.error('Error fetching user departments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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
    const { name, description, color, icon } = req.body;

    try {
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        // Update fields
        if (name) department.name = name;
        if (description) department.description = description;
        if (color) department.color = color;
        if (icon) department.icon = icon;

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

export const joinDepartment = async (req, res) => {
  try {
    // First check authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const { departmentId, userId } = req.params;

    // Verify requesting user matches target user
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to perform this action' 
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Validate department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ 
        success: false,
        message: 'Department not found' 
      });
    }

    // Check if user is already a member
    if (department.members.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'User is already a member of this department' 
      });
    }

    // Check department limit (max 3 departments)
    const userDepartments = await Department.find({ members: userId });
    if (userDepartments.length >= 3) {
      return res.status(400).json({ 
        success: false,
        message: 'User cannot join more than 3 departments' 
      });
    }

    // Add user to department
    department.members.push(userId);
    await department.save();

    res.status(200).json({ 
      success: true,
      message: 'Successfully joined department',
      department: {
        _id: department._id,
        name: department.name
      }
    });
  } catch (error) {
    console.error('Error joining department:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const leaveDepartment = async (req, res) => {
  try {
    // First check authentication
   if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const { userId, departmentId } = req.params;

    // Verify requesting user matches target user
    console.log('Requesting user ID:', req.user._id);
    console.log('Target user ID:', userId);
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to perform this action" });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if user is a member
    if (!department.members.some(id => id.toString() === userId)) {
  return res.status(400).json({ error: 'User is not a member of this department' });
}


// Remove user from members
department.members = department.members.filter(id => id.toString() !== userId);

    await department.save();

    res.status(200).json({ 
      success: true,
      message: "Successfully left department",
      departmentId 
    });
  } catch (error) {
    console.error("Error leaving department:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

