const Contact = require("../models/Contact");
const sendEmail = require("../utils/sendEmail");

// Get all contacts (Admin only)
exports.getAllContacts = async (req, res) => {
  try {
    console.log('📧 Fetching all contact messages...');
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${contacts.length} contact messages`);
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message, inquiryType } = req.body;

    console.log('📝 New contact form submission:', { name, email, inquiryType });

    // Validation
    if (!name || !email || !phone || !message || !inquiryType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Get userId if user is logged in (optional - contact form can be public)
    const userId = req.user ? req.user.id || req.user._id : null;

    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
      inquiryType,
      subject: inquiryType,
      status: "new",
      userId: userId,
    });

    console.log('✅ Contact message saved to MongoDB:', contact._id);

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: "We received your message",
        text: `Hi ${name},\n\nThank you for contacting us. We will get back to you soon.\n\nBest regards,\nMani Electrical Shop Team`,
      });
      console.log('📧 Confirmation email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Email send failed:', emailError.message);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reply to contact (Admin only)
exports.replyContact = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    console.log('💬 Admin replying to contact:', req.params.id);

    if (!replyMessage || replyMessage.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot be empty",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        replyMessage, 
        status: "replied",
        repliedAt: new Date(),
        repliedBy: req.admin?.name || 'Admin'
      },
      { new: true }
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    console.log('✅ Reply saved to database');

    // Send reply email to customer
    try {
      const emailSubject = contact.subject || contact.inquiryType || 'Your Inquiry';
      const emailBody = `
Hi ${contact.name},

Thank you for contacting Mani Electrical Shop.

Your Original Message:
"${contact.message}"

Our Reply:
${replyMessage}

If you have any further questions, please don't hesitate to reach out.

Best regards,
Mani Electrical Shop Team

---
You can also view this message in your account's Support Messages section.
      `;

      await sendEmail({
        to: contact.email,
        subject: `Reply to your message: ${emailSubject}`,
        text: emailBody,
      });

      console.log('📧 Reply email sent to:', contact.email);
    } catch (emailError) {
      console.error('⚠️ Email send failed:', emailError.message);
      // Continue even if email fails - reply is saved in database
    }

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error('❌ Reply error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark contact as read (Admin only)
exports.markAsRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: "read" },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact marked as read",
      data: contact,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete contact (Admin only)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unread contact count (Admin only)
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Contact.countDocuments({ status: "new" });
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer's own support messages (Customer only)
exports.getCustomerMessages = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please login.'
      });
    }

    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email;
    
    console.log('📬 Fetching support messages for customer:', { userId, userEmail });

    // Find messages by userId (preferred) OR email (fallback for old messages)
    const messages = await Contact.find({
      $or: [
        { userId: userId },
        { email: userEmail }
      ]
    })
      .sort({ createdAt: -1 })
      .select('-__v');

    console.log(`✅ Found ${messages.length} support messages for customer`);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('❌ Error fetching customer messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
