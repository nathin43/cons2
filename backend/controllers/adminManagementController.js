const Admin = require('../models/Admin');

/**
 * Admin Management Controller
 * 
 * ROLE-BASED ACCESS CONTROL:
 * - All routes REQUIRE MAIN_ADMIN role
 * - SUB_ADMIN requests receive 403 Forbidden
 * - Role validation done in middleware (mainAdminOnly)
 * 
 * MAIN_ADMIN Permissions:
 * - View all admin accounts
 * - Create new admin accounts (auto-assign as SUB_ADMIN unless email is manielectricals@gmail.com)
 * - Edit admin details (but cannot edit MAIN_ADMIN email)
 * - Delete admin accounts (but cannot delete MAIN_ADMIN)
 * 
 * MAIN_ADMIN RULES:
 * - Only manielectricals@gmail.com has MAIN_ADMIN role
 * - Role is determined by email, cannot be changed manually
 * - Cannot be deleted or edited by other admins
 */

/**
 * Get all admins
 * @route GET /api/admin-management/admins
 * @access Private/MAIN_ADMIN
 * @description Fetch all admin accounts in the system
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single admin by ID
 * @route GET /api/admin-management/admins/:id
 * @access Private/MAIN_ADMIN
 * @description Fetch specific admin account details
 */
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create new admin
 * @route POST /api/admin-management/admins
 * @access Private/MAIN_ADMIN
 * @description Create new admin account
 * 
 * ROLE AUTO-ASSIGNMENT:
 * - New admin email === 'manielectricals@gmail.com' → MAIN_ADMIN
 * - Any other email → SUB_ADMIN
 * 
 * Cannot override role from frontend request
 * Role is determined by email field only
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, status } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Automatically assign role based on email
    // Only manielectricals@gmail.com can be MAIN_ADMIN
    const role = email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN' : 'SUB_ADMIN';

    // Create new admin
    const newAdmin = await Admin.create({
      name,
      email,
      password,
      role,
      status: status || 'Active'
    });

    // Return admin without password
    const adminData = newAdmin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: adminData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update admin details
 * @route PUT /api/admin-management/admins/:id
 * @access Private/MAIN_ADMIN
 * @description Update admin account details
 * 
 * UPDATABLE FIELDS: name, email, status
 * NON-UPDATABLE: role (auto-assigned based on email)
 * 
 * PROTECTION RULES:
 * - Cannot change MAIN_ADMIN email (manielectricals@gmail.com)
 * - Cannot change admin email to MAIN_ADMIN email
 * - Role is automatically recalculated based on email
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, status } = req.body;

    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // SECURITY: Prevent changing email if it's the MAIN_ADMIN email
    // MAIN_ADMIN account (manielectricals@gmail.com) is protected from email changes
    if (email && email !== admin.email && admin.email === 'manielectricals@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the MAIN_ADMIN email'
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (email) {
      // Check if new email is already in use
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: req.params.id } });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      admin.email = email;
    }
    
    // SECURITY: Auto-assign role based on email
    // This ensures role consistency: manielectricals@gmail.com = MAIN_ADMIN, all others = SUB_ADMIN
    // Frontend cannot override this rule
    admin.role = admin.email === 'manielectricals@gmail.com' ? 'MAIN_ADMIN' : 'SUB_ADMIN';
    
    if (status) admin.status = status;

    // Save updated admin
    await admin.save();

    // Return admin without password
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin: adminData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete admin
 * @route DELETE /api/admin-management/admins/:id
 * @access Private/MAIN_ADMIN
 * @description Delete admin account
 * 
 * PROTECTION RULES:
 * - Cannot delete MAIN_ADMIN account (manielectricals@gmail.com)
 * - Can delete any SUB_ADMIN account
 * - Returns 403 Forbidden if attempting to delete MAIN_ADMIN
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // SECURITY: Prevent deleting the MAIN_ADMIN account
    // MAIN_ADMIN (manielectricals@gmail.com) is protected from deletion
    // This ensures at least one MAIN_ADMIN always exists
    if (admin.email === 'manielectricals@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the MAIN_ADMIN account'
      });
    }

    // Delete admin
    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
