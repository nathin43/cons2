/**
 * Notification Generator Utility
 * Provides helper functions to create notifications for different events
 */

const NotificationGenerator = {
  /**
   * Generate sales notification data
   */
  saleDone: (orderData) => ({
    type: 'SALE',
    title: 'New Sale Completed',
    description: `${orderData.customerName} purchased ${orderData.productName} for ₹${orderData.amount}`,
    icon: 'shopping-bag',
    color: 'green',
  }),

  /**
   * Generate low stock notification
   */
  lowStock: (productData) => ({
    type: 'LOW_STOCK',
    title: 'Low Stock Warning',
    description: `${productData.productName} has only ${productData.stock} units remaining`,
    icon: 'alert-triangle',
    color: 'orange',
  }),

  /**
   * Generate out of stock notification
   */
  outOfStock: (productData) => ({
    type: 'OUT_OF_STOCK',
    title: 'Product Out of Stock',
    description: `${productData.productName} is now out of stock`,
    icon: 'alert-circle',
    color: 'red',
  }),

  /**
   * Generate new order notification
   */
  newOrder: (orderData) => ({
    type: 'NEW_ORDER',
    title: 'New Order Received',
    description: `Order #${orderData.orderNumber} for ₹${orderData.amount} from ${orderData.customerName}`,
    icon: 'shopping-cart',
    color: 'blue',
  }),

  /**
   * Generate order cancelled notification
   */
  orderCancelled: (orderData) => ({
    type: 'ORDER_CANCELLED',
    title: 'Order Cancelled by Customer',
    description: `Order #${orderData.orderNumber} has been cancelled by ${orderData.customerName}`,
    icon: 'x-circle',
    color: 'red',
  }),

  /**
   * Generate new customer registration notification
   */
  newCustomer: (customerData) => ({
    type: 'NEW_CUSTOMER',
    title: 'New Customer Joined',
    description: `${customerData.customerName} has registered. Email: ${customerData.email}`,
    icon: 'user-plus',
    color: 'purple',
  }),

  /**
   * Generate contact message notification
   */
  contactMessage: (contactData) => ({
    type: 'CONTACT_MESSAGE',
    title: 'New Contact Message Received',
    description: `From: ${contactData.from} - ${contactData.subject}`,
    icon: 'mail',
    color: 'blue',
  }),

  /**
   * Generate refund request notification
   */
  refundRequest: (refundData) => ({
    type: 'REFUND_REQUEST',
    title: 'Refund Request Submitted',
    description: `Refund request for Order #${refundData.orderNumber} - ₹${refundData.amount} from ${refundData.customerName}`,
    icon: 'undo-2',
    color: 'yellow',
  }),
};

export default NotificationGenerator;
