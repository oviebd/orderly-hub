# OrderFlow - Comprehensive Testing Plan

> **For Testers**: This document contains step-by-step instructions to test every feature of the OrderFlow application. Each test case includes what to test, how to test it, and what the expected result should be.

---

## Prerequisites for Testing

### Required Items:
1. Web browser (Chrome, Firefox, or Safari recommended)
2. Internet connection
3. Access to the OrderFlow application URL
4. Test data for import (Excel files) - can be created during testing

### Test User Accounts Needed:
- **Business User Account** (for main feature testing)
- **Admin Account** (for admin dashboard testing)

---

## 1. Landing Page & Navigation Tests

### Test 1.1: Landing Page Display
**What to Test**: Verify the landing page loads correctly with all elements

**Steps**:
1. Open the OrderFlow application URL in a web browser
2. Observe the page content

**Expected Results**:
- ✅ Landing page loads successfully
- ✅ "OrderFlow" logo and name visible in the header
- ✅ "Sign In" and "Get Started" buttons are visible
- ✅ Hero section displays with tagline about WhatsApp orders
- ✅ Three feature cards visible (Fast Order Entry, Customer Memory, Status Tracking)
- ✅ Order source pills displayed (WhatsApp, Messenger, Phone)
- ✅ Footer section visible with copyright information

### Test 1.2: Navigation Buttons
**What to Test**: Verify navigation buttons work correctly

**Steps**:
1. From landing page, click "Get Started" button
2. Note the page you're redirected to
3. Go back and click "Sign In" button

**Expected Results**:
- ✅ "Get Started" redirects to login/registration page
- ✅ "Sign In" redirects to login page
- ✅ Both buttons work without errors

---

## 2. Authentication Tests

### Test 2.1: Business User Registration
**What to Test**: Create a new business user account

**Steps**:
1. From login page, find and click "Sign Up" or "Create Account" option
2. Enter test email (e.g., testuser@example.com)
3. Enter password (at least 6 characters)
4. Confirm password (same as above)
5. Click "Sign Up" or submit button

**Expected Results**:
- ✅ Account is created successfully
- ✅ Success message or notification appears
- ✅ User is redirected to "Register Business" page (onboarding)

### Test 2.2: Business Registration (Onboarding)
**What to Test**: Complete business profile setup

**Steps**:
1. On Register Business page, enter:
   - Business Name: "Test Shop"
   - Phone Number: "1234567890"
   - Business Address: "123 Test Street"
   - WhatsApp Link (optional): "https://wa.me/1234567890"
   - Facebook Link (optional): "https://facebook.com/testshop"
   - YouTube Link (optional): "https://youtube.com/testshop"
2. Click "Complete Registration" or submit button

**Expected Results**:
- ✅ Business profile is created
- ✅ Success notification appears
- ✅ User is redirected to dashboard
- ✅ Cannot access dashboard without completing this step

### Test 2.3: Business User Login
**What to Test**: Login with existing business account

**Steps**:
1. Navigate to login page
2. Enter registered email
3. Enter password
4. Click "Login" or "Sign In" button

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to business dashboard
- ✅ No errors displayed

### Test 2.4: Login with Wrong Credentials
**What to Test**: Error handling for incorrect login

**Steps**:
1. Navigate to login page
2. Enter email: "wrong@example.com"
3. Enter password: "wrongpassword"
4. Click login button

**Expected Results**:
- ✅ Login fails
- ✅ Error message displayed (e.g., "Invalid credentials")
- ✅ User remains on login page

### Test 2.5: Admin Login
**What to Test**: Admin user can access admin dashboard

**Steps**:
1. Navigate to `/admin/login` page
2. Enter admin email credentials
3. Enter admin password
4. Click login

**Expected Results**:
- ✅ Admin login successful
- ✅ Redirected to admin dashboard (different from business dashboard)
- ✅ Admin-specific features visible

---

## 3. Dashboard Tests

### Test 3.1: Dashboard Overview Display
**What to Test**: Main dashboard displays correctly with statistics

**Steps**:
1. Login as business user
2. Observe the dashboard page

**Expected Results**:
- ✅ Dashboard loads successfully
- ✅ Statistics cards visible (Total Volume, Total Revenue, Order Status)
- ✅ Recent orders section visible
- ✅ Charts/graphs display (if orders exist)
- ✅ Navigation sidebar visible with menu items

### Test 3.2: Dashboard Time Filtering
**What to Test**: Filter dashboard data by time periods

**Steps**:
1. On dashboard, locate time filter buttons (Today, Week, Month, All)
2. Click "Today" button
3. Note the displayed statistics
4. Click "Week" button
5. Note any changes in statistics
6. Click "Month" button
7. Click "All" button

**Expected Results**:
- ✅ Each filter button is clickable
- ✅ Statistics update when filter changes
- ✅ Active filter button is highlighted
- ✅ Data matches the selected time range

### Test 3.3: Dashboard Date Range Picker
**What to Test**: Custom date range filtering

**Steps**:
1. On dashboard, find and click the date range picker
2. Select a start date
3. Select an end date
4. Confirm the selection

**Expected Results**:
- ✅ Date picker opens when clicked
- ✅ Can select both start and end dates
- ✅ Dashboard updates with filtered data
- ✅ Selected date range is displayed

---

## 4. Order Management Tests

### Test 4.1: Create New Order (Basic)
**What to Test**: Add a new order with one product

**Steps**:
1. From dashboard or Orders page, click "Add Order" or "+ New Order" button
2. In the order dialog:
   - Select or create customer (Name: "John Doe", Phone: "9876543210")
   - Select or add product (Name: "Test Product", Price: 100)
   - Set quantity: 1
   - Set delivery charge: 10
   - Select order date: Today
   - Select delivery date: Tomorrow
   - Select source: WhatsApp
   - Add notes: "Test order"
3. Click "Save" or "Create Order"

**Expected Results**:
- ✅ Order is created successfully
- ✅ Success notification appears
- ✅ Order appears in the orders list
- ✅ Total amount calculated correctly (110 = 100 + 10)
- ✅ Order status is "Pending" by default

### Test 4.2: Create Order with Multiple Products
**What to Test**: Add order with multiple products

**Steps**:
1. Click "Add Order" button
2. Select/create customer
3. Add first product (Name: "Product A", Price: 50, Quantity: 2)
4. Click "Add Another Product" or similar button
5. Add second product (Name: "Product B", Price: 30, Quantity: 1)
6. Set delivery charge: 15
7. Complete other order details
8. Click "Create Order"

**Expected Results**:
- ✅ Both products added to order
- ✅ Total amount calculated correctly (165 = 50×2 + 30×1 + 15)
- ✅ Order saved with all products
- ✅ Products visible in order details

### Test 4.3: View Order Details
**What to Test**: View complete order information

**Steps**:
1. From Orders page, click on any order in the list
2. Observe the order details page

**Expected Results**:
- ✅ Order details page opens
- ✅ Customer name and phone displayed
- ✅ All products listed with quantities and prices
- ✅ Delivery charge shown
- ✅ Total amount displayed correctly
- ✅ Order date and delivery date visible
- ✅ Order status badge displayed with correct color
- ✅ Order source icon displayed (WhatsApp/Messenger/Phone)
- ✅ Notes section visible

### Test 4.4: Change Order Status
**What to Test**: Update order status from Order Details page

**Steps**:
1. Open an order with "Pending" status
2. Click "Change Status" or status dropdown
3. Select "Processing"
4. Confirm the change

**Expected Results**:
- ✅ Status change option available
- ✅ Status updates to "Processing"
- ✅ Status badge color changes accordingly
- ✅ Success notification appears
- ✅ Change is saved to database

### Test 4.5: Cancel Order with Feedback
**What to Test**: Cancel an order and provide cancellation reason

**Steps**:
1. Open any active order
2. Click "Change Status" and select "Cancelled"
3. In the feedback dialog:
   - Select rating: 3 stars
   - Enter comment: "Customer requested cancellation"
4. Submit the feedback

**Expected Results**:
- ✅ Feedback dialog appears when cancelling
- ✅ Rating and comment fields available
- ✅ Order status changes to "Cancelled"
- ✅ Cancellation feedback is saved
- ✅ Status badge shows "Cancelled" with appropriate color

### Test 4.6: Filter Orders by Status
**What to Test**: Filter order list by different statuses

**Steps**:
1. Go to Orders page
2. Click "Pending" filter button
3. Observe the displayed orders
4. Click "Processing" filter button
5. Click "Completed" filter button
6. Click "Cancelled" filter button
7. Click "All" to clear filters

**Expected Results**:
- ✅ Only orders with selected status are displayed
- ✅ Filter buttons highlight when active
- ✅ Can select multiple statuses simultaneously
- ✅ "All" shows all orders regardless of status
- ✅ Order count updates based on filter

### Test 4.7: Filter Orders by Source
**What to Test**: Filter orders by order source

**Steps**:
1. On Orders page, find source filter (WhatsApp, Messenger, Phone)
2. Select "WhatsApp" filter
3. Observe results
4. Select "Messenger" filter
5. Select "Phone" filter
6. Clear filters

**Expected Results**:
- ✅ Only orders from selected source displayed
- ✅ Source icons visible on order cards
- ✅ Filter selection highlighted
- ✅ Can combine with status filters

### Test 4.8: Search Orders
**What to Test**: Search functionality for orders

**Steps**:
1. On Orders page, locate search box
2. Enter customer name (e.g., "John")
3. Observe filtered results
4. Clear search and enter product name
5. Clear search

**Expected Results**:
- ✅ Search box available and functional
- ✅ Results filter as you type
- ✅ Can search by customer name
- ✅ Can search by product name
- ✅ Clear button removes search filter

### Test 4.9: Delete Order
**What to Test**: Remove an order from the system

**Steps**:
1. Open an order details page or locate order in list
2. Click delete button (trash icon or "Delete" button)
3. In confirmation dialog, confirm deletion

**Expected Results**:
- ✅ Confirmation dialog appears asking to confirm
- ✅ After confirmation, order is deleted
- ✅ Success notification appears
- ✅ Order removed from orders list
- ✅ Redirected to orders list

### Test 4.10: Export Orders to Excel
**What to Test**: Export order data to Excel file

**Steps**:
1. Go to Orders page
2. Click "Export" button
3. Wait for download to complete
4. Open the downloaded Excel file

**Expected Results**:
- ✅ Export button available
- ✅ Excel file downloads successfully
- ✅ File contains all order data (customer names, products, amounts, dates, status)
- ✅ Data is properly formatted in columns
- ✅ All visible orders are included in export

### Test 4.11: Import Orders from Excel
**What to Test**: Import orders from an Excel file

**Steps**:
1. Create an Excel file with columns: Customer Name, Phone, Product Name, Quantity, Price, Delivery Charge, Order Date, Delivery Date, Source, Notes
2. Add 2-3 sample rows
3. On Orders page, click "Import" button
4. Select the Excel file
5. Wait for import to complete

**Expected Results**:
- ✅ Import dialog/button available
- ✅ File selection works
- ✅ Progress indicator shows during import
- ✅ Success message when import completes
- ✅ Imported orders appear in the list
- ✅ Data matches the Excel file
- ✅ Error messages for invalid data

---

## 5. Customer Management Tests

### Test 5.1: View Customer List
**What to Test**: Display all customers

**Steps**:
1. Click "Customers" in navigation menu
2. Observe the customers page

**Expected Results**:
- ✅ Customers page loads successfully
- ✅ Customer list displayed (if customers exist)
- ✅ Each customer shows: name, phone, email, rating
- ✅ "Add Customer" button visible
- ✅ Search and filter options available

### Test 5.2: Add New Customer
**What to Test**: Create a new customer manually

**Steps**:
1. On Customers page, click "Add Customer" button
2. Enter customer details:
   - Name: "Jane Smith"
   - Phone: "5551234567"
   - Email: "jane@example.com"
   - Address: "456 Customer Ave"
3. Click "Save" or "Add Customer"

**Expected Results**:
- ✅ Customer creation dialog opens
- ✅ All fields available for input
- ✅ Customer is created successfully
- ✅ Success notification appears
- ✅ Customer appears in customer list
- ✅ Rating defaults to 0 or blank

### Test 5.3: Prevent Duplicate Phone Numbers
**What to Test**: Cannot create customer with existing phone number

**Steps**:
1. Click "Add Customer"
2. Enter phone number that already exists in system
3. Fill other details
4. Try to save

**Expected Results**:
- ✅ Error message appears
- ✅ Message indicates phone number already exists
- ✅ Customer is not created
- ✅ Dialog remains open for correction

### Test 5.4: View Customer Details
**What to Test**: View complete customer information and history

**Steps**:
1. From Customers page, click on a customer name or row
2. Observe the customer details page

**Expected Results**:
- ✅ Customer details page opens
- ✅ Customer name, phone, email, address displayed
- ✅ Customer rating displayed
- ✅ Order history for this customer visible
- ✅ Customer experiences/feedback section visible
- ✅ Edit option available for customer info

### Test 5.5: Edit Customer Information
**What to Test**: Update customer details

**Steps**:
1. Open customer details page
2. Click "Edit" button
3. Change name to "Jane Doe Smith"
4. Change address to "789 New Street"
5. Click "Save"

**Expected Results**:
- ✅ Fields become editable
- ✅ Changes can be made
- ✅ Phone number field is NOT editable (locked)
- ✅ Save button available
- ✅ Changes are saved successfully
- ✅ Updated information displayed

### Test 5.6: Add Customer Experience/Rating
**What to Test**: Rate a customer and add feedback

**Steps**:
1. Open customer details page
2. Find "Add Experience" or similar button
3. Select rating: 4 stars
4. Enter comment: "Great customer, prompt payment"
5. Save the experience

**Expected Results**:
- ✅ Experience form is available
- ✅ Can select rating (1-5 stars)
- ✅ Can enter comment
- ✅ Experience is saved
- ✅ Customer's overall rating updates (calculated from all experiences)
- ✅ Experience appears in history

### Test 5.7: Edit Customer Experience
**What to Test**: Modify existing customer feedback

**Steps**:
1. On customer details page with existing experience
2. Click "Edit" on an experience entry
3. Change rating to 5 stars
4. Update comment
5. Save changes

**Expected Results**:
- ✅ Edit option available for experiences
- ✅ Can modify rating and comment
- ✅ Changes save successfully
- ✅ Customer's overall rating recalculates
- ✅ Updated experience displayed

### Test 5.8: Search Customers
**What to Test**: Search for customers by name, phone, or email

**Steps**:
1. On Customers page, locate search box
2. Type "Jane" in search
3. Observe filtered results
4. Clear and search by phone "555"
5. Clear and search by email

**Expected Results**:
- ✅ Search box functional
- ✅ Results filter as you type
- ✅ Can search by name
- ✅ Can search by phone number
- ✅ Can search by email
- ✅ Clear button resets search

### Test 5.9: Sort Customer List
**What to Test**: Sort customers by different criteria

**Steps**:
1. On Customers page, click column header to sort by name
2. Click again to reverse sort
3. Click "Last Order" column to sort by last order date

**Expected Results**:
- ✅ Clicking column header sorts the list
- ✅ Sort direction toggles (ascending/descending)
- ✅ Arrow indicator shows sort direction
- ✅ Can sort by name
- ✅ Can sort by last order date

### Test 5.10: Export Customers
**What to Test**: Export customer data to Excel

**Steps**:
1. On Customers page, click "Export" button
2. Wait for download
3. Open the Excel file

**Expected Results**:
- ✅ Export button available
- ✅ Excel file downloads
- ✅ File contains all customer data (name, phone, email, address, rating)
- ✅ Data properly formatted

### Test 5.11: Import Customers
**What to Test**: Import customers from Excel file

**Steps**:
1. Create Excel file with columns: Name, Phone, Email, Address
2. Add 2-3 sample customers
3. Click "Import" button
4. Select the file
5. Wait for import

**Expected Results**:
- ✅ Import dialog available
- ✅ File selection works
- ✅ Progress indicator shows
- ✅ Customers imported successfully
- ✅ Imported customers appear in list
- ✅ Duplicate phone numbers rejected with error

### Test 5.12: Delete Customer
**What to Test**: Remove a customer from system

**Steps**:
1. On customer details or list page, click delete button
2. Confirm deletion in dialog

**Expected Results**:
- ✅ Delete button available
- ✅ Confirmation required before deletion
- ✅ Customer deleted successfully
- ✅ Customer removed from list
- ✅ Cannot delete customer with existing orders (should show error)

---

## 6. Product Management Tests

### Test 6.1: View Product List
**What to Test**: Display all products

**Steps**:
1. Click "Products" in navigation menu
2. Observe the products page

**Expected Results**:
- ✅ Products page loads
- ✅ Product list displayed in table format
- ✅ Columns visible: Code, Name, Price, Details
- ✅ "Add Product" button available
- ✅ Export/Import options visible (if plan allows)

### Test 6.2: Add New Product
**What to Test**: Create a new product

**Steps**:
1. Click "Add Product" or "+ New Product" button
2. Fill in product details:
   - Code: "PROD001"
   - Name: "Test Widget"
   - Price: 250
   - Details: "High quality test widget"
3. Click "Save"

**Expected Results**:
- ✅ Product creation form/page opens
- ✅ All fields available
- ✅ Product code is optional
- ✅ Product created successfully
- ✅ Success notification appears
- ✅ Product appears in product list

### Test 6.3: Product Code Uniqueness
**What to Test**: Cannot create products with duplicate codes

**Steps**:
1. Try to add a new product with existing code "PROD001"
2. Fill other details
3. Try to save

**Expected Results**:
- ✅ Error message appears
- ✅ Indicates code already exists
- ✅ Product not created
- ✅ Can correct and retry

### Test 6.4: Edit Product
**What to Test**: Update product information

**Steps**:
1. From Products page, click edit button on a product
2. Change name to "Updated Widget"
3. Change price to 300
4. Update details
5. Save changes

**Expected Results**:
- ✅ Edit form/dialog opens
- ✅ Current values pre-filled
- ✅ Can modify all fields
- ✅ Changes save successfully
- ✅ Updated info displayed in list

### Test 6.5: Export Products
**What to Test**: Export product catalog to Excel

**Steps**:
1. On Products page, click "Export" button
2. Wait for download
3. Open Excel file

**Expected Results**:
- ✅ Export button available (if plan allows)
- ✅ File downloads successfully
- ✅ Contains all products with code, name, price, details
- ✅ Data properly formatted

### Test 6.6: Import Products
**What to Test**: Import products from Excel

**Steps**:
1. Create Excel with columns: Code, Name, Price, Details
2. Add 3-4 sample products
3. Click "Import" button
4. Select file
5. Wait for import

**Expected Results**:
- ✅ Import button available (if plan allows)
- ✅ File selection works
- ✅ Progress indicator shows
- ✅ Products imported successfully
- ✅ Duplicate codes rejected
- ✅ New products appear in list

### Test 6.7: Delete Product
**What to Test**: Remove a product

**Steps**:
1. Click delete button on a product
2. Confirm deletion

**Expected Results**:
- ✅ Delete button available
- ✅ Confirmation required
- ✅ Product deleted
- ✅ Removed from list
- ✅ Success notification

---

## 7. Business Profile Tests

### Test 7.1: View Business Profile
**What to Test**: Display current business information

**Steps**:
1. Click "Profile" in navigation menu
2. Observe the profile page

**Expected Results**:
- ✅ Profile page loads
- ✅ Business name displayed
- ✅ Owner email displayed (non-editable)
- ✅ Phone number displayed
- ✅ Business address displayed
- ✅ Social media links shown
- ✅ Current plan information visible
- ✅ Edit button available

### Test 7.2: Edit Business Profile
**What to Test**: Update business information

**Steps**:
1. On Profile page, click "Edit" button
2. Change business name to "Updated Test Shop"
3. Update phone number
4. Update address
5. Update social media links
6. Click "Save"

**Expected Results**:
- ✅ Edit mode activates
- ✅ Fields become editable
- ✅ Email field remains non-editable
- ✅ Changes save successfully
- ✅ Success notification appears
- ✅ Updated info displayed

### Test 7.3: Change Password
**What to Test**: Update account password

**Steps**:
1. On Profile page, find "Change Password" section
2. Enter current password
3. Enter new password: "newpassword123"
4. Confirm new password: "newpassword123"
5. Click "Change Password"

**Expected Results**:
- ✅ Password change form available
- ✅ Requires current password
- ✅ Requires password confirmation
- ✅ Password updated successfully
- ✅ Success notification appears
- ✅ Can login with new password

### Test 7.4: View Current Plan
**What to Test**: Display subscription plan details

**Steps**:
1. On Profile page, locate "Plan & Subscription" section
2. Observe the displayed information

**Expected Results**:
- ✅ Current plan name displayed (e.g., "Lite", "Standard", "Premium")
- ✅ Plan price shown
- ✅ Plan capabilities listed:
  - Can add orders
  - Can add customers
  - Can add products
  - Has export/import option
  - Maximum limits (orders, customers, products)
- ✅ "Update Plan" or "Change Plan" button available

### Test 7.5: Update Subscription Plan
**What to Test**: Change to different plan

**Steps**:
1. Click "Update Plan" button
2. View available plans in modal
3. Select a different plan (e.g., from Lite to Standard)
4. Confirm plan change

**Expected Results**:
- ✅ Plan selection modal opens
- ✅ All available plans displayed with details
- ✅ Can select different plan
- ✅ Plan updates successfully
- ✅ New plan details reflected in profile
- ✅ New capabilities activated

---

## 8. Admin Dashboard Tests

### Test 8.1: Access Admin Dashboard
**What to Test**: Admin can login and view dashboard

**Steps**:
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Observe admin dashboard

**Expected Results**:
- ✅ Admin login page accessible
- ✅ Login successful with admin credentials
- ✅ Admin dashboard displays (different from business dashboard)
- ✅ Business owners list visible
- ✅ Global statistics displayed
- ✅ Admin-specific navigation available

### Test 8.2: View Business Owners List
**What to Test**: See all registered businesses

**Steps**:
1. On Admin Dashboard, locate "Business Owners" tab
2. Observe the list

**Expected Results**:
- ✅ List of all business accounts displayed
- ✅ Each entry shows:
  - Business name
  - Email
  - Status (Enabled/Disabled)
  - Account creation date
  - Current plan
- ✅ Action buttons available (Enable/Disable, View Details)

### Test 8.3: Search Business by Email
**What to Test**: Find specific business account

**Steps**:
1. On Admin Dashboard, find search box
2. Enter a business owner's email
3. Click search

**Expected Results**:
- ✅ Search functionality works
- ✅ Matching business highlighted or filtered
- ✅ Can clear search
- ✅ "Not found" message if email doesn't exist

### Test 8.4: Disable Business Account
**What to Test**: Restrict business access

**Steps**:
1. Find an enabled business account
2. Click "Disable" or toggle status to disabled
3. Confirm the action

**Expected Results**:
- ✅ Status toggle/button available
- ✅ Account status changes to "Disabled"
- ✅ Action logged in activity log
- ✅ Business user cannot login with disabled account

### Test 8.5: Enable Business Account
**What to Test**: Restore business access

**Steps**:
1. Find a disabled business account
2. Click "Enable" or toggle status
3. Confirm

**Expected Results**:
- ✅ Status changes to "Enabled"
- ✅ Action logged
- ✅ Business user can now login

### Test 8.6: View Business Details
**What to Test**: Drill down into specific business

**Steps**:
1. Click on a business name or "View Details" button
2. Observe the detailed view

**Expected Results**:
- ✅ Detailed business view opens
- ✅ Complete business information displayed
- ✅ Business-specific statistics shown:
  - Total orders
  - Total revenue
  - Order status distribution
- ✅ Time filters available (Today, Week, Month, All)
- ✅ Activity log for this business visible
- ✅ "Back to List" button available

### Test 8.7: Change Business Capabilities
**What to Test**: Modify what a business can do

**Steps**:
1. In business details view, find capabilities section
2. Toggle "Can Add Orders" off
3. Toggle "Can Add Customers" off
4. Save changes

**Expected Results**:
- ✅ Capability toggles available
- ✅ Changes save successfully
- ✅ Action logged
- ✅ Business user sees restrictions when logged in

### Test 8.8: Assign Plan to Business
**What to Test**: Apply subscription plan

**Steps**:
1. In business details, find plan section
2. Click "Apply Plan" or similar
3. Select "Standard" plan
4. Confirm

**Expected Results**:
- ✅ Plan selection available
- ✅ Can choose from available plans (Lite, Standard, Premium)
- ✅ Plan applies successfully
- ✅ Business capabilities updated according to plan
- ✅ Action logged

### Test 8.9: View Plan Management Tab
**What to Test**: See and edit plan definitions

**Steps**:
1. Click "Plan Management" tab
2. Observe the plan list

**Expected Results**:
- ✅ Plan Management tab accessible
- ✅ All plans displayed (Lite, Standard, Premium)
- ✅ Each plan shows:
  - Name
  - Price
  - Capabilities
  - Limits (max orders, customers, products)
- ✅ Edit options available

### Test 8.10: Edit Plan Definition
**What to Test**: Modify plan settings

**Steps**:
1. In Plan Management, click edit on "Standard" plan
2. Change max orders to 600
3. Change price to 15
4. Save changes

**Expected Results**:
- ✅ Plan edit form available
- ✅ Can modify price
- ✅ Can modify capabilities and limits
- ✅ Changes save successfully
- ✅ All businesses on this plan get updated limits

### Test 8.11: View Activity Log
**What to Test**: See admin action history

**Steps**:
1. On Admin Dashboard, find Activity Log section
2. Observe the entries

**Expected Results**:
- ✅ Activity log displayed
- ✅ Each entry shows:
  - Admin email who performed action
  - Action type
  - Target business
  - Timestamp
  - Details
- ✅ Can filter by time period
- ✅ Most recent actions shown first

### Test 8.12: View Global Statistics
**What to Test**: See aggregated stats across all businesses

**Steps**:
1. On Admin Dashboard main view, observe statistics section

**Expected Results**:
- ✅ Global statistics displayed:
  - Total orders across all businesses
  - Total revenue
  - Total number of businesses
  - Order status distribution
- ✅ Can filter by time period
- ✅ Charts/graphs display data

---

## 9. Advanced Order Features Tests

### Test 9.1: Order with Optional Times
**What to Test**: Create order without specific times

**Steps**:
1. Create new order
2. Select order date but don't set time
3. Select delivery date but don't set time
4. Save order

**Expected Results**:
- ✅ Order saves successfully
- ✅ Shows dates only (no specific times)
- ✅ hasOrderTime and hasDeliveryTime flags set correctly
- ✅ Displays properly in order list

### Test 9.2: Order with Specific Times
**What to Test**: Create order with exact times

**Steps**:
1. Create new order
2. Set order date and time (e.g., 2:30 PM today)
3. Set delivery date and time (e.g., 5:00 PM tomorrow)
4. Save order

**Expected Results**:
- ✅ Both date and time saved
- ✅ Times display in order details
- ✅ Short format times shown in order card
- ✅ Full date-time shown in details

### Test 9.3: View Customer from Order
**What to Test**: Navigate to customer from order details

**Steps**:
1. Open an order
2. Click on customer name or "View Customer" link

**Expected Results**:
- ✅ Link is clickable
- ✅ Redirects to customer details page
- ✅ Correct customer information displayed
- ✅ Can navigate back to order

### Test 9.4: Add Order from Customer Page
**What to Test**: Create order while viewing customer

**Steps**:
1. Go to customer details page
2. Find and click "Add Order" or similar button
3. Create order (customer should be pre-selected)

**Expected Results**:
- ✅ Add order option available on customer page
- ✅ Customer pre-selected in order form
- ✅ Order creation works normally
- ✅ New order appears in customer's order history

---

## 10. Plan-based Restriction Tests

### Test 10.1: Free/Lite Plan Limits
**What to Test**: Verify free plan restrictions

**Setup**: Ensure test account is on Free/Lite plan

**Steps**:
1. Try to import customers (should be blocked)
2. Try to export orders (should be blocked)
3. Create 50 orders
4. Try to create 51st order

**Expected Results**:
- ✅ Import/Export buttons disabled or show upgrade message
- ✅ Can create up to 50 orders
- ✅ Cannot create 51st order - shows limit reached message
- ✅ Message prompts to upgrade plan

### Test 10.2: Standard Plan Features
**What to Test**: Verify standard plan capabilities

**Setup**: Upgrade account to Standard plan

**Steps**:
1. Check if Import/Export buttons are available
2. Verify max limits are 500 for orders
3. Test import functionality

**Expected Results**:
- ✅ Import/Export buttons enabled
- ✅ Can import/export data
- ✅ Limit messages show 500 instead of 50
- ✅ Can create up to 500 orders

### Test 10.3: Premium Plan Unlimited Access
**What to Test**: Verify premium has no limits

**Setup**: Upgrade to Premium plan

**Steps**:
1. Check max limits displayed
2. Create many orders (50+)
3. Use all features

**Expected Results**:
- ✅ Max limits show "Unlimited" or very high numbers (999999)
- ✅ No restriction messages
- ✅ All features fully accessible
- ✅ Import/Export enabled

---

## 11. UI/UX Tests

### Test 11.1: Responsive Design - Mobile
**What to Test**: Application works on mobile devices

**Steps**:
1. Open application on mobile device or resize browser to mobile width (375px)
2. Navigate through pages

**Expected Results**:
- ✅ Layout adjusts to mobile screen
- ✅ Navigation menu accessible (hamburger menu if applicable)
- ✅ All features accessible
- ✅ Buttons and forms usable on touch screen
- ✅ No horizontal scrolling required
- ✅ Text readable without zooming

### Test 11.2: Responsive Design - Tablet
**What to Test**: Application works on tablets

**Steps**:
1. View on tablet or resize browser to tablet width (768px)

**Expected Results**:
- ✅ Layout optimized for tablet screen
- ✅ All features accessible
- ✅ Good use of screen space

### Test 11.3: Navigation Active States
**What to Test**: Current page highlighted in navigation

**Steps**:
1. Navigate to Dashboard
2. Observe sidebar navigation
3. Navigate to Orders
4. Navigate to Customers
5. Navigate to Products

**Expected Results**:
- ✅ Active page highlighted in navigation menu
- ✅ Different color or background for active link
- ✅ Clear visual indication of current location

### Test 11.4: Toast Notifications
**What to Test**: Success and error messages display

**Steps**:
1. Perform any action that triggers success (e.g., create order)
2. Perform action that causes error (e.g., duplicate phone)

**Expected Results**:
- ✅ Success toast appears after successful actions
- ✅ Error toast appears for errors
- ✅ Messages are clear and descriptive
- ✅ Toasts auto-dismiss after a few seconds
- ✅ Can manually dismiss toasts

### Test 11.5: Loading States
**What to Test**: Loading indicators during operations

**Steps**:
1. Import a large file
2. Observe loading indicator
3. Load a page with lots of data

**Expected Results**:
- ✅ Loading spinner or progress bar shown during async operations
- ✅ Progress percentage shown for imports
- ✅ UI doesn't freeze or become unresponsive
- ✅ Clear indication that system is working

### Test 11.6: Confirmation Dialogs
**What to Test**: Destructive actions require confirmation

**Steps**:
1. Try to delete an order
2. Try to delete a customer
3. Try to cancel an order

**Expected Results**:
- ✅ Confirmation dialog appears before deletion
- ✅ Can cancel the action
- ✅ Can confirm the action
- ✅ Clear warning message about permanent action

---

## 12. Data Integrity Tests

### Test 12.1: Timestamp Tracking
**What to Test**: Created and updated timestamps are recorded

**Steps**:
1. Create a new customer
2. Note creation time
3. Edit the customer
4. Check timestamps

**Expected Results**:
- ✅ createdAt timestamp set on creation
- ✅ updatedAt timestamp updates on edit
- ✅ Timestamps display in readable format
- ✅ Timestamps accurate to actual time

### Test 12.2: Customer Rating Calculation
**What to Test**: Overall rating calculated from experiences

**Steps**:
1. Open customer with no rating
2. Add experience with 5 stars
3. Add another experience with 3 stars
4. Check customer's overall rating

**Expected Results**:
- ✅ Rating starts at 0 or blank
- ✅ After first experience, rating is 5
- ✅ After second experience, rating is 4 (average of 5 and 3)
- ✅ Rating updates automatically
- ✅ Rating is NOT manually editable

### Test 12.3: Order Total Calculation
**What to Test**: Order total auto-calculates correctly

**Steps**:
1. Create order with Product A ($50, qty 2)
2. Add Product B ($30, qty 3)
3. Set delivery charge $20
4. Check total amount

**Expected Results**:
- ✅ Subtotal calculated: 50×2 + 30×3 = $190
- ✅ Total with delivery: 190 + 20 = $210
- ✅ Total updates when quantities change
- ✅ Total updates when products added/removed
- ✅ Calculation accurate

---

## 13. Error Handling Tests

### Test 13.1: Network Error Handling
**What to Test**: Application handles lost connection

**Steps**:
1. Disconnect internet
2. Try to create an order
3. Reconnect internet

**Expected Results**:
- ✅ Error message displayed
- ✅ Message indicates network issue
- ✅ Application doesn't crash
- ✅ Can retry once connection restored

### Test 13.2: Invalid Data Entry
**What to Test**: Form validation works

**Steps**:
1. Try to create order without selecting customer
2. Try to create product without name
3. Try to enter negative price

**Expected Results**:
- ✅ Validation errors shown
- ✅ Required fields marked
- ✅ Cannot submit invalid form
- ✅ Clear error messages
- ✅ Fields highlight with errors

### Test 13.3: Session Expiry
**What to Test**: Handle expired login session

**Steps**:
1. Login and wait for session timeout (or manually expire)
2. Try to perform action

**Expected Results**:
- ✅ Redirected to login page
- ✅ Message about session expiry
- ✅ Can login again
- ✅ No data loss

---

## 14. Logout & Security Tests

### Test 14.1: Logout Functionality
**What to Test**: User can logout successfully

**Steps**:
1. While logged in, find logout button
2. Click logout

**Expected Results**:
- ✅ Logout button visible in navigation or profile
- ✅ User logged out successfully
- ✅ Redirected to login or landing page
- ✅ Cannot access protected pages after logout
- ✅ Must login again to access dashboard

### Test 14.2: Protected Routes
**What to Test**: Unauthenticated users cannot access app

**Steps**:
1. Logout completely
2. Try to navigate directly to `/dashboard`
3. Try to access `/orders`
4. Try to access `/customers`

**Expected Results**:
- ✅ Redirected to login page
- ✅ Cannot view protected pages without login
- ✅ After login, can access pages normally

### Test 14.3: Role-based Access
**What to Test**: Admin and business users have separate access

**Steps**:
1. Login as business user
2. Try to access `/admin/dashboard`
3. Logout and login as admin
4. Try to access regular `/dashboard`

**Expected Results**:
- ✅ Business user cannot access admin dashboard
- ✅ Admin cannot access business dashboard (or redirects appropriately)
- ✅ Each role sees appropriate navigation
- ✅ Proper redirects prevent unauthorized access

---

## Test Completion Checklist

After completing all tests, verify:

- [ ] All 14 sections tested
- [ ] All critical features working
- [ ] No blocking bugs found
- [ ] User experience is smooth
- [ ] Data integrity maintained
- [ ] Security measures functioning
- [ ] Responsive design works
- [ ] Import/Export working
- [ ] Plan restrictions enforced
- [ ] Admin functions operational

---

## Reporting Test Results

### For each test that **PASSES**:
- Mark with ✅
- Note: "Working as expected"

### For each test that **FAILS**:
- Mark with ❌
- Document:
  - What went wrong
  - Steps to reproduce
  - Expected vs actual result
  - Screenshot if possible
  - Browser and device used

### Example Bug Report Format:
```
Test #: 4.1
Test Name: Create New Order (Basic)
Status: ❌ FAILED

Issue: Order total not calculating correctly
Steps to Reproduce:
  1. Create order with product price $100
  2. Add delivery charge $10
  3. Check total amount

Expected: Total should be $110
Actual: Total shows $100 (delivery charge not added)

Browser: Chrome 120
Device: Desktop
Screenshot: attached
Priority: HIGH
```

---

## Notes for Testers

1. **Take your time**: Don't rush through tests
2. **Test thoroughly**: Try edge cases (empty fields, very long text, special characters)
3. **Document everything**: Take screenshots of any issues
4. **Ask questions**: If something is unclear, ask the development team
5. **Be creative**: Try to "break" the application with unusual inputs
6. **Test on multiple devices**: Mobile, tablet, desktop
7. **Test on multiple browsers**: Chrome, Firefox, Safari
8. **Clear cache**: If seeing odd behavior, try clearing browser cache
9. **Report positives too**: Let developers know what works well
10. **Suggest improvements**: If you have ideas for better UX, share them

---

**Total Test Cases**: 100+
**Estimated Testing Time**: 8-12 hours for complete testing
**Recommended Team Size**: 2-3 testers working in parallel
