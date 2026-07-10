# Bharat EV Prime - API Documentation

Base URL: `http://localhost:5000/api`

## User APIs

### 1. Register User
**Endpoint:** `POST /api/user/register`
**Description:** Register a new user in the system.

```bash
curl -X POST http://localhost:5000/api/user/register \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "johndoe@example.com"
}'
```

### 2. Send OTP
**Endpoint:** `POST /api/user/send-otp`
**Description:** Send an OTP to the user's mobile number.

```bash
curl -X POST http://localhost:5000/api/user/send-otp \
-H "Content-Type: application/json" \
-d '{
  "mobile": "9876543210"
}'
```

### 3. Login User (with OTP)
**Endpoint:** `POST /api/user/login`
**Description:** Verify OTP and login (OTP is fixed to '1234').

```bash
curl -X POST http://localhost:5000/api/user/login \
-H "Content-Type: application/json" \
-d '{
  "mobile": "9876543210",
  "otp": "1234"
}'
```

### 4. Get All Users (Admin Protected) 
**Endpoint:** `GET /api/user`
**Description:** Fetch a list of all registered users.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/user \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 5. Get User Full View (Admin Protected)
**Endpoint:** `GET /api/user/:id`
**Description:** Fetch full details of a specific user by their ID.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/user/USER_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 6. Edit Profile (User Protected)
**Endpoint:** `PUT /api/user/profile`
**Description:** User updates their own profile details (name, email, profileImage). Admin cannot edit users.
**Requires:** Bearer Token (User)

```bash
curl -X PUT http://localhost:5000/api/user/profile \
-H "Authorization: Bearer YOUR_USER_TOKEN_HERE" \
-F "name=Shiva Updated" \
-F "email=shiva.updated@example.com" \
-F "profileImage=@/path/to/your/image.jpg"
```

### 7. Delete User (Admin Protected)
**Endpoint:** `DELETE /api/user/:id`
**Description:** Remove a user from the system.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/user/USER_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Station APIs

### 1. Create Station (Admin Protected)
**Endpoint:** `POST /api/station`
**Description:** Create a new EV charging station.
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/station \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "name": "Green Park Station",
  "location": "Green Park",
  "city": "Delhi",
  "address": "Green Park Main Market",
  "latitude": 28.5562,
  "longitude": 77.2065,
  "powerCapacity": 50,
  "connectors": 6,
  "partner": "Green Energy",
  "status": "Active"
}'
```

### 2. Get All Stations (Admin Protected)
**Endpoint:** `GET /api/station`
**Description:** Fetch all EV charging stations.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/station \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 3. Get Station By ID (Admin Protected)
**Endpoint:** `GET /api/station/:id`
**Description:** Fetch details of a specific station.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/station/STATION_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 4. Update Station (Admin Protected)
**Endpoint:** `PUT /api/station/:id`
**Description:** Update EV charging station details.
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/station/STATION_ID_HERE \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "status": "Maintenance",
  "connectors": 8
}'
```

### 5. Delete Station (Admin Protected)
**Endpoint:** `DELETE /api/station/:id`
**Description:** Remove a station from the system.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/station/STATION_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Partner APIs

### 1. Create Partner (Admin Protected)
**Endpoint:** `POST /api/partner`
**Description:** Create a new partner.
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/partner \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "name": "Green Energy Solutions",
  "contactPerson": "Amit Verma",
  "email": "amit@greenenergy.com",
  "phone": "+91 98765 43210",
  "status": "Active",
  "stationsCount": 45
}'
```

### 2. Get All Partners (Admin Protected)
**Endpoint:** `GET /api/partner`
**Description:** Fetch a list of all partners.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/partner \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 3. Update Partner (Admin Protected)
**Endpoint:** `PUT /api/partner/:id`
**Description:** Update partner details.
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/partner/PARTNER_ID_HERE \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "status": "Blocked"
}'
```

### 4. Delete Partner (Admin Protected)
**Endpoint:** `DELETE /api/partner/:id`
**Description:** Delete a partner.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/partner/PARTNER_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Franchise APIs

### 1. Create Franchise (Admin Protected)
**Endpoint:** `POST /api/franchise`
**Description:** Create a new franchise.
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/franchise \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "name": "Green Future EV",
  "owner": "Sanjay Mehta",
  "location": "Connaught Place",
  "city": "Delhi",
  "status": "Active",
  "stationsCount": 6
}'
```

### 2. Get All Franchises (Admin Protected)
**Endpoint:** `GET /api/franchise`
**Description:** Fetch a list of all franchises.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/franchise \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 3. Update Franchise (Admin Protected)
**Endpoint:** `PUT /api/franchise/:id`
**Description:** Update franchise details.
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/franchise/FRANCHISE_ID_HERE \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "status": "Inactive"
}'
```

### 4. Delete Franchise (Admin Protected)
**Endpoint:** `DELETE /api/franchise/:id`
**Description:** Delete a franchise.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/franchise/FRANCHISE_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Payment APIs

### 1. Create Payment (Admin Protected - For Testing)
**Endpoint:** `POST /api/payment`
**Description:** Create a new payment record (mock).
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/payment \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "txnId": "TXN987654321",
  "user": "Rahul Sharma",
  "amount": 1200,
  "method": "UPI",
  "status": "Success"
}'
```

### 2. Get All Payments (Admin Protected)
**Endpoint:** `GET /api/payment`
**Description:** Fetch a list of all payments.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/payment \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 3. Delete Payment (Admin Protected)
**Endpoint:** `DELETE /api/payment/:id`
**Description:** Delete a payment (for cleanup).
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/payment/PAYMENT_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Refund APIs

### 1. Create Refund (Admin Protected - For Testing)
**Endpoint:** `POST /api/refund`
**Description:** Create a new refund record (mock).
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/refund \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "refundId": "RFND12345",
  "user": "Amit Kumar",
  "amount": 500,
  "reason": "Payment Failed",
  "status": "Pending"
}'
```

### 2. Get All Refunds (Admin Protected)
**Endpoint:** `GET /api/refund`
**Description:** Fetch a list of all refunds.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/refund \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 3. Update Refund Status (Admin Protected)
**Endpoint:** `PUT /api/refund/:id`
**Description:** Update a refund status to Approved, Pending, or Rejected.
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/refund/REFUND_ID_HERE \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "status": "Approved"
}'
```

### 4. Delete Refund (Admin Protected)
**Endpoint:** `DELETE /api/refund/:id`
**Description:** Delete a refund record.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/refund/REFUND_ID_HERE \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Analytics APIs

### 1. Get Analytics Dashboard Data (Admin Protected)
**Endpoint:** `GET /api/analytics`
**Description:** Fetch AI-powered insights, forecast data, and top recommendations.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/analytics \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Carbon Dashboard APIs

### 1. Get Carbon Dashboard Data (Admin Protected)
**Endpoint:** `GET /api/carbon`
**Description:** Fetch dynamic environmental impact stats, trend data, and city contributions based on total energy consumed. Supports `?range=7d|30d|all`.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/carbon?range=30d \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Government Dashboard APIs

### 1. Get Gov Dashboard Data (Admin Protected)
**Endpoint:** `GET /api/gov`
**Description:** Fetch government specific stats, tax revenue charts, state coverages, and geocoordinates for all active stations.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/gov \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Heatmap APIs

### 1. Get Heatmap Data (Admin Protected)
**Endpoint:** `GET /api/heatmap`
**Description:** Fetch dynamic heatmap node points (lat, lng, usage intensity) and active station counts.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/heatmap \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## City Analytics APIs

### 1. Get City Analytics Data (Admin Protected)
**Endpoint:** `GET /api/analytics/city`
**Description:** Fetch aggregated stats, charts, top stations, and connector distribution for a specific city.
**Query Parameters:** `?city=Name` (Optional. Defaults to first available city)
**Requires:** Bearer Token (Admin)

```bash
curl -X GET "http://localhost:5000/api/analytics/city?city=Delhi" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## CMS / Banner Management APIs

### 1. Get All Banners (Admin Protected)
**Endpoint:** `GET /api/cms`
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/cms \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 2. Add New Banner (Admin Protected)
**Endpoint:** `POST /api/cms`
**Content-Type:** `multipart/form-data`
**Requires:** Bearer Token (Admin)

**Form Fields:**
- `title` (String, required)
- `type` (String: Homepage, Promotion, Information, Campaign)
- `url` (String, required)
- `status` (String: Active, Inactive)
- `priority` (Number)
- `bannerImage` (File: svg/png/jpg/gif, required)

### 3. Update Banner (Admin Protected)
**Endpoint:** `PUT /api/cms/:id`
**Content-Type:** `multipart/form-data`
**Requires:** Bearer Token (Admin)

**Form Fields:**
- `title` (String, optional)
- `type` (String, optional)
- `url` (String, optional)
- `status` (String, optional)
- `priority` (Number, optional)
- `bannerImage` (File: svg/png/jpg/gif, optional)

### 4. Delete Banner (Admin Protected)
**Endpoint:** `DELETE /api/cms/:id`
**Requires:** Bearer Token (Admin)

---

## Support Center APIs

### 1. Get Support Settings (Public)
**Endpoint:** `GET /api/support/settings`
**Returns:** Support contact information.

### 2. Update Support Settings (Admin Protected)
**Endpoint:** `PUT /api/support/settings`
**Requires:** Bearer Token (Admin)
**Body:** JSON with `email`, `phone`, `liveChatUrl`, `timing`.

### 3. Get Articles (Public)
**Endpoint:** `GET /api/support/articles`
**Returns:** List of help articles.

### 4. Add Article (Admin Protected)
**Endpoint:** `POST /api/support/articles`
**Requires:** Bearer Token (Admin)
**Body:** `title`, `category`, `content`, `status`, `isPopular`

### 5. Update Article (Admin Protected)
**Endpoint:** `PUT /api/support/articles/:id`
**Requires:** Bearer Token (Admin)
**Body:** Fields to update.

### 6. Delete Article (Admin Protected)
**Endpoint:** `DELETE /api/support/articles/:id`
**Requires:** Bearer Token (Admin)

---

## Ticket Management APIs

### 1. Get All Tickets (Admin Protected)
**Endpoint:** `GET /api/tickets`
**Requires:** Bearer Token (Admin)
**Query Params:** `status`, `priority`, `search`

### 2. Create New Ticket (Public/User)
**Endpoint:** `POST /api/tickets`
**Body:** `user`, `subject`, `category`, `priority`, `message`

### 3. Update Ticket / Add Reply (Admin Protected)
**Endpoint:** `PUT /api/tickets/:id`
**Requires:** Bearer Token (Admin)
**Body:** `status`, `priority`, `replyMessage`, `adminName`

### 4. Delete Ticket (Admin Protected)
**Endpoint:** `DELETE /api/tickets/:id`
**Requires:** Bearer Token (Admin)

---

## Reports APIs

### 1. Generate Report (Admin Protected)
**Endpoint:** `GET /api/reports/generate`
**Requires:** Bearer Token (Admin)
**Query Params:**
- `type` (String, required): e.g. User, Station, Partner, Ticket
- `startDate` (String, ISO format, optional)
- `endDate` (String, ISO format, optional)
**Returns:** CSV File Buffer

---

## Audit Logs APIs

### 1. Get Audit Logs (Admin Protected)
**Endpoint:** `GET /api/audit`
**Requires:** Bearer Token (Admin)
**Query Params:**
- `search` (String, optional)
- `module` (String, optional)
- `dateFilter` (String: Today, This Week, This Month, optional)
- `page` (Number, default 1)
- `limit` (Number, default 10)
**Returns:** JSON array of audit logs with pagination metadata.

---

## Security Center APIs

### 1. Get Security Settings (Admin Protected)
**Endpoint:** `GET /api/security/settings`
**Description:** Fetch global security settings (toggles) and last scan date.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/security/settings \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 2. Update Security Setting (Admin Protected)
**Endpoint:** `PUT /api/security/settings`
**Description:** Toggle a specific security setting (`twoFactor`, `ipWhitelist`, `sessionTimeout`, `loginAlerts`).
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/security/settings \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{"key": "twoFactor", "value": true}'
```

### 3. Get Security Stats (Admin Protected)
**Endpoint:** `GET /api/security/stats`
**Description:** Fetch system health, active threats, and 24h failed login stats.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/security/stats \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 4. Get Security Events (Admin Protected)
**Endpoint:** `GET /api/security/events`
**Description:** Fetch recent security events and threats from audit logs.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/security/events \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 5. Run Security Scan (Admin Protected)
**Endpoint:** `POST /api/security/scan`
**Description:** Manually trigger a system security scan. Updates last scan date.
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/security/scan \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 6. Get Active Sessions (Admin Protected)
**Endpoint:** `GET /api/security/sessions`
**Description:** Fetch a list of active admin sessions.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/security/sessions \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 7. Terminate Other Sessions (Admin Protected)
**Endpoint:** `DELETE /api/security/sessions/terminate-others`
**Description:** Terminate all active sessions except the current one.
**Requires:** Bearer Token (Admin)

```bash
curl -X DELETE http://localhost:5000/api/security/sessions/terminate-others \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

---

## Settings APIs

### 1. Get Settings (Admin Protected)
**Endpoint:** `GET /api/settings`
**Description:** Fetch platform preferences, notifications, appearance, integrations, and billing info.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/settings \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 2. Update Settings (Admin Protected)
**Endpoint:** `PUT /api/settings`
**Description:** Update any setting field.
**Requires:** Bearer Token (Admin)

```bash
curl -X PUT http://localhost:5000/api/settings \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
-d '{
  "themeMode": "dark",
  "language": "Hindi"
}'
```

### 3. Generate New API Key (Admin Protected)
**Endpoint:** `POST /api/settings/apikey`
**Description:** Generate a new production API key for integrations.
**Requires:** Bearer Token (Admin)

```bash
curl -X POST http://localhost:5000/api/settings/apikey \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

---

## Dashboard APIs

### 1. Get Dashboard Analytics (Admin Protected)
**Endpoint:** `GET /api/dashboard`
**Description:** Fetch aggregated stats, revenue/energy charts, and recent activity logs for the main admin dashboard.
**Requires:** Bearer Token (Admin)

```bash
curl -X GET http://localhost:5000/api/dashboard \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```
