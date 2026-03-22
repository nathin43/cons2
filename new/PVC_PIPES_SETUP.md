# PVC Pipes Products - Setup Guide

This guide explains how to add PVC pipe products to your electric-shop-ecommerce site.

## What's Included

8 high-quality PVC pipe product listings with detailed specifications:

1. **PVC Elbow Connector 90°** - ₹45
   - Gray durable construction
   - ½" to 2" sizes available
   - Perfect for drainage and plumbing systems

2. **PVC Ball Valve Blue Handle** - ₹120
   - Professional-grade water control
   - Brass ball mechanism
   - 3-year warranty

3. **PVC Tee Connector** - ₹35
   - Three-way pipe connection
   - Schedule 40 PVC material
   - Suitable for water systems

4. **PVC Coupling Connector** - ₹25
   - Simple straight connector
   - Solvent-weld connection
   - Multiple sizes available

5. **PVC Threaded Adapters Set** - ₹180
   - 8-piece comprehensive set
   - Male and female NPT connections
   - Essential for plumbing projects

6. **PVC End Cap Plugs** - ₹15
   - Seals PVC pipe ends
   - Weather-resistant
   - ½" to 3" available

7. **PVC Pipe Assortment Bundle** - ₹550
   - Complete starter kit
   - Multiple sizes and styles
   - Perfect for DIY projects

8. **PVC Straight Pipe 10ft Length** - ₹95
   - Standard Schedule 40
   - 1" to 4" diameter options
   - Water supply and drainage ready

## Installation Steps

### 1. Seed the Products to Database

From the `backend` directory, run:

```bash
npm run seed:pipes
```

This will add all 8 PVC pipe products to your MongoDB database.

### 2. Replace Placeholder Images

The system includes placeholder SVG images. To add real product images:

1. Prepare high-quality images (JPG/PNG) of actual products
2. Replace files in `backend/uploads/products/`:
   - `pvc-elbow.jpg`
   - `pvc-ball-valve.jpg`
   - `pvc-tee.jpg`
   - `pvc-coupling.jpg`
   - `pvc-adapters.jpg`
   - `pvc-end-cap.jpg`
   - `pvc-assortment.jpg`
   - `pvc-straight-pipe.jpg`

3. Keep the same filenames for proper display

### 3. Verify Installation

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Visit the site and go to Products → Pipes category
4. You should see all 8 new pipe products

## Product Features

Each product includes:
- **Detailed Description**: Explains use cases and benefits
- **Specifications**: Material, dimensions, color, warranty
- **Pricing**: Competitive rates in INR (₹)
- **Stock Management**: Inventory tracking
- **Ratings**: Pre-populated with customer ratings
- **Category**: All listed under "Pipes" category

## Database Schema

Products are stored with these fields:
- `name` - Product name
- `description` - Detailed description
- `price` - Cost in rupees
- `category` - "Pipes" category
- `brand` - Brand name (PVC Pro, HydroFlow, etc.)
- `image` - Product image path
- `stock` - Available quantity
- `specifications` - Technical details
- `ratings` - Average rating and count

## Admin Panel Integration

Products can be managed through the admin panel:
- Edit product details
- Update prices and stock
- Add/remove products
- Upload new images
- Manage product listings

## Next Steps

1. ✅ Products are now in database
2. ✅ Images are in place (placeholder/actual)
3. ✅ Available in Pipes category on frontend
4. Consider: Add more pipe sizes/variations
5. Consider: Add product reviews section
6. Consider: Create bundle deals

## Troubleshooting

**Products not showing?**
- Verify MongoDB is running: `npm run test-db`
- Check frontend is fetching category "Pipes"
- Review browser console for errors

**Images not displaying?**
- Ensure files exist in `backend/uploads/products/`
- Check file permissions
- Verify image file formats (JPG/PNG)

**Database errors?**
- Ensure MongoDB connection string is correct in `.env`
- Check MongoDB service is running
- Run: `npm run test-db` to verify connection

## Support

For issues or modifications, contact your development team.

---

**Last Updated**: January 2, 2026
**Category**: Pipes & Plumbing
**Total Products Added**: 8
