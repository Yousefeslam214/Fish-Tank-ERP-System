FishFarm360 - Functional Requirements Specification
1. Authentication & Authorization
FR-001: User Authentication with Two-Factor Authentication
Description: The system shall authenticate users using email/phone and password, with mandatory Two-Factor Authentication (2FA) for Admin and Farm Manager roles.
Preconditions:
•	User has a registered account in the system
•	User has access to their registered email or phone for 2FA
•	System authentication service is operational
Input:
•	Email address or phone number (international format, e.g., +20XXXXXXXXX)
•	Password (minimum 12 characters, bcrypt encrypted)
•	2FA code (6-digit OTP)
Process:
1.	User enters email/phone and password on login page
2.	System validates credentials against Users DB
3.	System verifies password hash using bcrypt
4.	If credentials valid, system generates 6-digit OTP
5.	System sends OTP via SMS (Twilio) or email (SendGrid)
6.	User enters OTP within 5 minutes
7.	System validates OTP
8.	System generates JWT token with role and permissions
9.	System logs login event to Activity Log with timestamp and IP address
10.	System redirects user to appropriate dashboard based on role
Output:
•	JWT authentication token (valid for 24 hours)
•	User session established
•	Login event recorded in Activity Log
•	User redirected to role-specific dashboard
Performance Requirements:
•	Password validation must complete within 1 second
•	OTP must be sent within 3 seconds of password validation
•	Total authentication process must complete within 10 seconds
Business Rules:
•	After 3 failed login attempts, account is locked for 15 minutes
•	OTP expires after 5 minutes
•	Admin and Farm Manager roles require 2FA; Technician and Accountant optional
•	Password must be changed every 90 days
•	Same password cannot be reused within last 5 password changes
Exception Handling:
•	Invalid credentials: Display error message, increment failed attempt counter
•	Expired OTP: Allow user to request new OTP (maximum 3 times per hour)
•	Locked account: Display message with unlock time or contact admin option
________________________________________
FR-002: Role-Based Access Control (RBAC)
Description: The system shall enforce role-based permissions dynamically, restricting user access to features and data based on assigned roles.
Preconditions:
•	User is authenticated with valid JWT token
•	User role is assigned by Administrator
•	Permissions are defined in system configuration
Input:
•	User ID and role (Admin, Farm Manager, Technician, Accountant)
•	Requested resource/action (e.g., "view_financial_reports")
•	JWT token with embedded permissions
Process:
1.	User attempts to access a system feature or data
2.	System extracts role and permissions from JWT token
3.	System queries Permissions DB for role-specific access rules
4.	System checks if requested action is permitted for user's role
5.	If permitted, system grants access and logs action to Activity Log
6.	If denied, system returns 403 Forbidden error and logs attempt
7.	System updates last accessed timestamp for the resource
Output:
•	Access granted or denied
•	Activity logged with user ID, action, resource, timestamp, and result
•	Error message displayed if access denied
Performance Requirements:
•	Permission check must complete within 100 milliseconds
•	Permission rules must be cached for 5 minutes to reduce DB queries
Business Rules:
•	Admin: Full access to all features including user management, system configuration
•	Farm Manager: Access to dashboard, tanks, inventory, accounting, analytics; cannot modify user permissions
•	Technician: Access to water quality monitoring, growth tracking, health records; read-only access to inventory
•	Accountant: Access to accounting, financial reports; read-only access to inventory costs
•	Permissions can be customized per user by Admin (granular control)
•	All permission changes must be logged and require Admin authentication
Exception Handling:
•	Missing JWT token: Redirect to login page
•	Expired JWT: Prompt user to re-authenticate
•	Invalid role: Display error and log security incident
________________________________________
2. Multi-Farm Management
FR-003: Real-Time Dashboard Aggregation
Description: The system shall display a unified dashboard aggregating real-time data from multiple farms including weather forecasts, feed consumption, alerts, growth metrics, and market prices.
Preconditions:
•	User is authenticated as Farm Manager or Admin
•	At least one farm is registered in the system
•	IoT sensors are configured and transmitting data
•	External APIs (Weather, Market Prices) are accessible
Input:
•	User ID and accessible farm IDs
•	Date range for historical data (default: last 7 days)
•	Selected farm filter (optional, default: all farms)
Process:
1.	User accesses dashboard via web or mobile interface
2.	System queries Farms DB for user's accessible farms
3.	System retrieves latest sensor data from Water Quality DB (last 4 hours)
4.	System fetches weather forecast from OpenWeatherMap API for each farm location
5.	System calculates feed consumption from Inventory DB (daily and weekly totals)
6.	System queries Growth Records DB for latest FCR, SGR, WG metrics
7.	System retrieves market prices from Market Price API (updated twice daily)
8.	System checks Notifications DB for active alerts per farm
9.	System generates interactive map using Leaflet.js with color-coded tank status
10.	System renders dashboard with all aggregated data
11.	System establishes WebSocket connection for real-time updates
Output:
•	Dashboard displaying: 
o	Weather forecast (7-day, hourly updates)
o	Feed consumption graphs (daily/weekly with 30-day average comparison)
o	Active alerts list with severity indicators
o	Growth metrics charts (FCR, SGR, WG) with historical comparison
o	Water quality summary per tank
o	Current market prices with trend indicators
o	Interactive map with color-coded tank health status
•	Real-time notifications via WebSocket
•	Dashboard load timestamp
Performance Requirements:
•	Dashboard must load within 2 seconds for farms with up to 50 tanks
•	Real-time updates must appear within 3 seconds of data change
•	Map rendering must complete within 1.5 seconds
•	Weather and market price API calls must timeout after 5 seconds
Business Rules:
•	Dashboard refreshes automatically every 5 minutes
•	Alerts are color-coded: Red (critical), Yellow (warning), Green (normal)
•	Tank health status: Green (>90% optimal), Yellow (70-90%), Red (<70%)
•	Feed consumption alerts trigger at 10% remaining stock
•	Weather alerts trigger for temperatures >35°C or <10°C
•	Market price changes >10% from previous day are highlighted
Exception Handling:
•	No farms assigned: Display message prompting user to add farms
•	API failure (Weather/Market): Display cached data with timestamp, retry every 2 minutes
•	Sensor offline: Display last known value with "X minutes ago" indicator
•	No data available: Display placeholder with "No data" message
________________________________________
FR-004: Water Quality Threshold Monitoring and Alerting
Description: The system shall continuously monitor water quality parameters from IoT sensors and generate alerts when values exceed species-specific safe ranges.
Preconditions:
•	Tank is configured with fish species profile
•	IoT sensors are installed and operational
•	Threshold values are defined for the species
•	User notification preferences are set
Input:
•	Sensor reading data: pH, DO (Dissolved Oxygen), Ammonia, Temperature, Salinity, Turbidity
•	Tank ID and fish species
•	Timestamp of reading
•	Sensor ID
Process:
1.	IoT sensor transmits reading via MQTT protocol every 4 hours (or continuously for critical parameters)
2.	IoT Service receives and validates sensor data format
3.	System queries Tanks DB to retrieve fish species and threshold configuration
4.	System retrieves species-specific safe ranges: 
o	pH: 6.5-8.5 (varies by species)
o	DO: >5 mg/L (critical if <3 mg/L)
o	Ammonia: <0.5 mg/L
o	Temperature: species-dependent (e.g., 25-30°C for Tilapia)
o	Salinity: species-dependent
o	Turbidity: <40 NTU
5.	System compares reading against threshold ranges
6.	If value outside safe range, system calculates severity level: 
o	Critical: DO <3 mg/L, pH <6.0 or >9.0, Ammonia >2 mg/L
o	Warning: Values approaching limits
o	Normal: Within safe range
7.	System stores reading in Water Quality DB with status flag
8.	If alert triggered, system creates alert record in Notifications DB
9.	System publishes WaterQualityAlertTriggered event
10.	Notification Service consumes event and sends alerts based on severity: 
o	Critical: SMS, Email, WhatsApp, Dashboard
o	Warning: Email, Dashboard
11.	System applies alert throttling (max 1 alert per parameter per tank every 15 minutes)
12.	System logs all events to Activity Log
Output:
•	Water quality reading stored in database
•	Alert notification delivered to Farm Manager and Technicians
•	Alert displayed on dashboard with recommended actions
•	Historical data available for trend analysis
•	Alert record with severity, timestamp, parameter, value, threshold
Performance Requirements:
•	Alert must be generated within 5 seconds of receiving critical sensor reading
•	Notification must be delivered within 10 seconds of alert generation
•	System must process 1000+ sensor readings per minute
•	Dashboard must update within 3 seconds of alert
Business Rules:
•	Critical alerts sent via all channels (SMS, Email, WhatsApp, Dashboard)
•	Warning alerts sent via Dashboard and Email only
•	Alert throttling: maximum one alert per parameter per tank every 15 minutes
•	Consecutive critical alerts (3+ in 1 hour) escalate to Admin
•	Historical data retained for 2 years
•	Sensor offline for >1 hour triggers connectivity alert
•	Alerts include actionable recommendations (e.g., "Increase aeration" for low DO)
Exception Handling:
•	Invalid sensor data: Log error, discard reading, send maintenance alert if repeated
•	Sensor offline: Display last known value with timestamp, alert if offline >1 hour
•	Threshold not configured: Use default species thresholds, alert Admin
•	Notification delivery failure: Retry 3 times with exponential backoff, log failure
•	Database unavailable: Queue readings in memory (max 1000), process when restored
________________________________________
3. Growth Tracking & Analysis
FR-005: Bi-Weekly Growth Sampling and Automatic Metric Calculation
Description: The system shall record bi-weekly fish weight samples and automatically calculate Feed Conversion Ratio (FCR), Specific Growth Rate (SGR), and Weight Gain (WG) with trend visualization.
Preconditions:
•	Tank is active with registered fish stock
•	Initial fish weight and count are recorded
•	Feed consumption data is being tracked
•	User has Technician or Farm Manager role
Input:
•	Tank ID
•	Sampling date (must be 14 ± 2 days from last sample)
•	Sample size (number of fish weighed)
•	Individual or average weight (in grams or kg)
•	Total fish count in tank (updated if mortality occurred)
Process:
1.	Technician navigates to Growth Tracking module
2.	System displays tanks due for sampling (14 days since last sample)
3.	Technician selects tank and enters weight data
4.	System validates data: 
o	Sample size ≥ 20 fish (or 10% of stock, whichever is greater)
o	Weight values are positive and realistic for species
o	Sampling date is within acceptable window
5.	System calculates average weight if individual weights provided
6.	System retrieves previous weight data from Growth Records DB
7.	System queries Inventory DB for total feed consumed since last sample
8.	System calculates metrics: 
o	FCR = Total Feed Given (kg) / Weight Gain (kg)
o	SGR = [(ln(Final Weight) - ln(Initial Weight)) / Days] × 100
o	WG = Final Weight - Initial Weight
9.	System stores growth record in Growth Records DB
10.	System compares metrics against: 
o	Expected values for species and age
o	Previous growth cycles
o	Same period last year (if available)
11.	System generates growth trend graphs (line charts)
12.	If growth rate drops below 1% weekly, system triggers alert
13.	System updates dashboard with new metrics
14.	System publishes GrowthDataUpdated event for Analytics module
Output:
•	Growth record stored with all calculated metrics
•	Visual charts displaying: 
o	Weight gain trend over time
o	FCR comparison (current vs. expected)
o	SGR trend with acceptable range highlighted
•	Alert if growth anomaly detected
•	Projected harvest date based on target weight
•	Growth report exportable as PDF
Performance Requirements:
•	Metric calculations must complete within 2 seconds
•	Charts must render within 3 seconds
•	System must support 100+ simultaneous growth entries
Business Rules:
•	Sampling interval: 14 days (±2 days acceptable)
•	Minimum sample size: 20 fish or 10% of stock
•	Expected FCR ranges (species-dependent): 
o	Tilapia: 1.2-1.5
o	Sea Bass: 1.5-2.0
o	Shrimp: 1.3-1.8
•	Growth rate alert threshold: <1% weekly
•	Historical data must be retained indefinitely for trend analysis
•	Manual override allowed for correcting data entry errors (logged)
•	Projected harvest date calculated based on target weight and current SGR
Exception Handling:
•	Missing feed data: Alert user, allow manual entry or estimate
•	Unrealistic weight values: Flag for review, require confirmation
•	Overdue sampling (>16 days): Display warning, allow entry with justification note
•	Calculation errors: Log error, notify Admin, display raw data only
________________________________________
4. Accounting
FR-006: Automated Expense Allocation and Financial Report Generation
Description: The system shall track operational expenses per tank and general farm expenses, automatically allocate shared costs, and generate comprehensive financial reports exportable to Excel/PDF.
Preconditions:
•	User has Accountant or Farm Manager role
•	Tanks are configured with production data
•	Expense categories are defined
•	Reporting period is specified
Input:
•	Expense details: 
o	Type: Feed, Medicine, Labor, Fuel, Electricity, Maintenance, Other
o	Amount (EGP, USD, or other currency)
o	Date and invoice number
o	Tank ID (for tank-specific) or Farm ID (for general expenses)
o	Supplier information
o	Tax details
o	Payment status (Paid, Pending, Overdue)
Process:
1.	User accesses Accounting module and selects "Add Expense"
2.	User enters expense details via form
3.	System validates: 
o	Amount is positive
o	Date is not in future
o	Tank/Farm ID exists
o	Currency is supported
4.	System stores expense in Expenses DB (tank-specific) or GeneralExpenses DB (farm-wide)
5.	For general expenses, system calculates allocation: 
o	Retrieves production percentage per tank from Growth Records DB
o	Distributes expense proportionally (e.g., 40% to high-output tank)
o	Allows manual adjustment by Accountant
6.	System links inventory-related expenses to Inventory DB
7.	System calculates totals: 
o	Total expenses per tank
o	Total expenses per farm
o	Category breakdown (feed, labor, etc.)
8.	User requests report for specified period (daily, weekly, monthly, or custom cycle)
9.	System queries Expenses DB and GeneralExpenses DB for date range
10.	System calculates: 
o	Total costs
o	Revenue (from production records if available)
o	Profit/Loss = Revenue - Costs
o	Cost per kg of fish produced
11.	System generates report with: 
o	Profit/Loss statement
o	Expense breakdown charts (pie/bar charts)
o	Comparison with previous period
o	Cost trends over time
12.	System exports report using jsPDF (PDF) or Excel library
13.	System emails report to stakeholders if configured
14.	System stores report metadata in database
Output:
•	Expense records stored in database
•	Allocated expenses linked to tanks
•	Financial report (PDF/Excel) containing: 
o	Executive summary
o	Detailed expense list
o	Profit/Loss statement
o	Visual charts and graphs
o	Cost per kg analysis
o	Period comparison
•	Email notification with report attachment
•	Report accessible via dashboard
Performance Requirements:
•	Expense entry must save within 1 second
•	Report generation must complete within 10 seconds for up to 300 transactions
•	PDF export must complete within 5 seconds
•	Email delivery must occur within 30 seconds
Business Rules:
•	General expenses allocated based on tank production percentage (default)
•	Manual allocation adjustments must be logged with justification
•	Multi-currency support with daily exchange rates from external API
•	Tax calculations follow Egyptian tax system (configurable)
•	Reports can be scheduled for automatic generation (monthly default)
•	Payment status tracked: Paid, Pending, Overdue (>30 days triggers alert)
•	Cost per kg = Total Costs / Total Production (kg)
•	Profit margin alert if <15%
Exception Handling:
•	Missing production data: Cannot calculate allocation, prompt user for manual entry
•	Invalid currency: Display error, list supported currencies
•	Report generation timeout: Generate partial report, notify user of incomplete data
•	Email delivery failure: Retry 3 times, allow manual download
•	Negative profit: Highlight in red, suggest cost optimization analysis
________________________________________
5. Inventory Management
FR-007: Inventory Depletion Prediction and Expiry Alerts
Description: The system shall track feed, medicine, equipment, and fuel inventory with automated depletion predictions and multi-stage expiry alerts.
Preconditions:
•	Inventory items are registered in system
•	Daily consumption data is being recorded
•	Expiry dates are entered for perishable items
•	User notification preferences are configured
Input:
•	Item details: 
o	Type: Feed, Medicine, Equipment, Fuel
o	Name and description (e.g., "Protein Feed 30%, 25kg")
o	Quantity and unit (kg, liters, pieces)
o	Entry date
o	Expiry date (if applicable)
o	Batch number
o	Supplier ID
o	Storage location
o	Reorder threshold (default: 15% of maximum stock)
Process:
1.	User adds new inventory item via Inventory module
2.	System stores item in Inventory DB with all details
3.	System initiates continuous monitoring: 
o	Tracks daily consumption from feed logs and treatment records
o	Calculates moving average consumption (30-day window)
o	Adjusts for seasonal variations (higher consumption in summer)
4.	System predicts depletion date: 
o	Formula: Depletion Date = Current Date + (Remaining Quantity / Average Daily Consumption)
o	Updates prediction daily
5.	System monitors expiry dates: 
o	Checks daily at 8:00 AM
o	Identifies items expiring in 30, 15, and 7 days
6.	System generates alerts: 
o	30 days before expiry: Email notification
o	15 days before expiry: Email + Dashboard notification
o	7 days before expiry: Email + Dashboard + SMS notification
o	Expired items: Critical alert, flag for disposal
7.	System checks stock levels: 
o	If quantity ≤ reorder threshold (15%), triggers low stock alert
o	Includes supplier contact info and suggested reorder quantity
8.	System provides reorder recommendations: 
o	Based on consumption trend
o	Considers lead time from supplier
o	Suggests optimal order quantity
9.	System integrates with Supplier APIs for automated reordering (optional)
10.	System logs all inventory transactions to Activity Log
Output:
•	Inventory record stored in database
•	Real-time stock levels displayed on dashboard
•	Expiry alerts delivered via configured channels
•	Low stock alerts with reorder recommendations
•	Predicted depletion dates for all items
•	Inventory report exportable to Excel/PDF
•	Barcode labels printable for physical tracking
Performance Requirements:
•	Inventory updates must process within 500 milliseconds
•	Depletion predictions must recalculate within 1 second
•	Expiry check must complete within 10 seconds for 600+ items
•	Dashboard inventory summary must load within 2 seconds
Business Rules:
•	Expiry alerts: 30 days (Email), 15 days (Email + Dashboard), 7 days (All channels)
•	Low stock threshold: 15% of maximum stock (customizable per item)
•	Expired items automatically flagged and removed from available inventory
•	First-In-First-Out (FIFO) principle applied for feed usage
•	Consumption calculation uses 30-day moving average
•	Seasonal adjustment factors applied (e.g., +20% in summer for feed)
•	Barcode scanning supported for quick entry/exit
•	Integration with supplier APIs for automated purchase orders
•	Reorder quantity = (Average Daily Consumption × Lead Time) + Safety Stock
Exception Handling:
•	Zero consumption recorded: Use default consumption rate for item type
•	Missing expiry date: Prompt user to enter or mark as non-perishable
•	Negative stock: Flag error, require inventory audit
•	Supplier API unavailable: Allow manual order entry, queue for sync
•	Unrealistic consumption spike: Alert for verification, possible data error
________________________________________
6. AI Assistant & Disease Detection
FR-008: AI-Powered Disease Diagnosis from Fish Images
Description: The system shall analyze uploaded fish images using a Convolutional Neural Network (CNN) to detect diseases, identify symptoms, and recommend treatments with confidence scores.
Preconditions:
•	User is authenticated as Technician or Farm Manager
•	CNN model is trained and deployed
•	Disease Library DB contains reference data
•	Image upload size limit is 10 MB
Input:
•	Fish image (JPEG, PNG, max 10 MB)
•	Tank ID (to link diagnosis to specific tank)
•	Optional: User notes describing symptoms
•	Image metadata (date, time, location if available)
Process:
1.	User uploads fish image via mobile app or web interface
2.	System validates image: 
o	File format (JPEG/PNG)
o	File size (<10 MB)
o	Image dimensions (minimum 224×224 pixels)
3.	System stores original image in Cloud Storage
4.	Image preprocessing: 
o	Resize to 224×224 pixels
o	Normalize pixel values (0-1 range)
o	Apply filters for clarity enhancement
o	Convert to tensor format
5.	System loads CNN model from Model Weights DB
6.	System performs inference: 
o	Forward pass through convolutional layers
o	Applies ReLU activations and max pooling
o	Flattens feature maps
o	Dense layer computation
o	Softmax activation for probability distribution
7.	System extracts top 3 disease predictions with probabilities
8.	System calculates confidence scores: 
o	Weighted confidence = Probability × Historical Accuracy
o	Considers prediction entropy
9.	System applies confidence threshold validation: 
o	If confidence ≥75%: Proceed with automatic diagnosis
o	If confidence <75%: Flag for expert review
10.	System queries Disease Library DB for matched disease: 
o	Disease name and description
o	Common symptoms
o	Treatment protocols
o	Medication dosages
11.	System queries Inventory DB for available medications
12.	System generates treatment recommendation: 
o	Medication name and dosage (e.g., "10ml antibiotic per 100L water")
o	Treatment duration (e.g., "7 days")
o	Additional care instructions
13.	If severe disease detected, system triggers high-priority alert
14.	System creates health record in Health Records DB
15.	System stores prediction results and feedback for model retraining
16.	System displays diagnosis to user with visual highlighting of affected areas
Output:
•	Disease diagnosis with confidence score
•	Top 3 possible diseases ranked by probability
•	Detailed disease information from library
•	Treatment recommendation with: 
o	Medication and dosage
o	Duration and frequency
o	Additional care instructions
o	Estimated recovery time
•	Alert notification if severe disease detected
•	Health record created and linked to tank
•	Image stored with annotations
•	Option to request expert review if low confidence
Performance Requirements:
•	Image upload must complete within 10 seconds
•	Preprocessing must complete within 2 seconds
•	CNN inference must complete within 5 seconds on GPU
•	Total diagnosis time must be <20 seconds
•	System must support 50+ diagnoses daily
Business Rules:
•	Confidence threshold for automatic diagnosis: 75%
•	Low confidence (<75%) cases flagged for expert (veterinarian) review
•	Expert reviews used for model retraining and accuracy improvement
•	Severe diseases (e.g., bacterial infections) trigger immediate alerts via all channels
•	All diagnoses logged for accuracy tracking and continuous improvement
•	Model accuracy target: ≥90% after training on 10,000+ labeled images
•	False positive rate must be <5%
•	Treatment recommendations only provided for confidence ≥75%
•	Diagnosis history retained for epidemiological analysis
Exception Handling:
•	Invalid image format: Display error, request re-upload
•	Image too small (<224×224): Reject with message explaining requirements
•	Model unavailable: Display "Service temporarily unavailable", queue request
•	Low confidence (<75%): Present results with disclaimer, offer expert review option
•	No matching disease: Suggest general health check, allow manual disease entry
•	Multiple diseases detected: Present all with probabilities, recommend expert consultation
•	Medication out of stock: Highlight in red, suggest alternative or supplier contact
________________________________________
7. Notification System
FR-009: Multi-Channel Critical Event Notification with Priority-Based Delivery
Description: The system shall deliver time-sensitive alerts and notifications via multiple channels (SMS, Email, WhatsApp) based on event severity and user preferences.
Preconditions:
•	User has configured notification preferences
•	User contact information is verified (phone, email)
•	External notification services (Twilio, SendGrid) are operational
•	Alert thresholds are configured
Input:
•	Event details: 
o	Event type: Water Quality Alert, Mortality Alert, Low Stock, Disease Detection, System Error
o	Severity: Critical, Warning, Info
o	Source: Tank ID, Farm ID, or System
o	Message content
o	Timestamp
•	User preferences: 
o	Preferred channels per event type
o	Quiet hours (e.g., no SMS 10 PM - 7 AM)
o	Alert frequency limits
Process:
1.	System event occurs (e.g., low DO detected, high mortality, stock depleted)
2.	System determines event severity: 
o	Critical: Immediate action required (DO <3 mg/L, 5%+ mortality, system failure)
o	Warning: Attention needed (values approaching limits, low stock)
o	Info: General updates (harvest ready, report generated)
3.	System queries Notifications DB for similar recent alerts
4.	System applies alert throttling: 
o	Max 1 alert per parameter per tank every 15 minutes (for repeated conditions)
o	No throttling for escalating conditions
5.	System retrieves user notification preferences from Users DB
6.	System determines delivery channels based on severity and preferences: 
o	Critical: SMS + Email + WhatsApp + Dashboard (all channels)
o	Warning: Email + Dashboard
o	Info: Dashboard only (unless user opts in)
7.	System checks quiet hours: 
o	If within quiet hours and not critical, delay until quiet hours end
o	Critical alerts bypass quiet hours
8.	System formats message for each channel: 
o	SMS: Short, actionable (max 160 characters)
o	Email: Detailed with context and recommendations
o	WhatsApp: Medium detail with clickable dashboard link
o	Dashboard: Full details with visual indicators
9.	System delivers notifications: 
o	Sends SMS via Twilio API
o	Sends Email via SendGrid API
o	Sends WhatsApp via Twilio WhatsApp Business API
o	Publishes to Dashboard via WebSocket
10.	System logs delivery attempts and status
11.	System implements retry logic for failed deliveries: 
o	3 retry attempts with exponential backoff (1s, 5s, 15s)
12.	System escalates if critical alert unacknowledged: 
o	After 10 minutes, escalate to Admin
o	After 20 minutes, escalate to backup contacts
13.	System stores notification record in Notifications DB
14.	User can acknowledge alerts via dashboard or reply to notification
Output:
•	Notifications delivered via configured channels
•	Delivery confirmation logged
•	Notification record stored in database with: 
o	Event details
o	Delivery status per channel
o	Timestamps (sent, delivered, read, acknowledged)
o	User actions taken
•	Dashboard updated with notification badge
•	Unacknowledged critical alerts highlighted
Performance Requirements:
•	Alert must be generated within 5 seconds of event occurrence
•	SMS must be sent within 10 seconds of alert generation
•	Email must be sent within 15 seconds
•	WhatsApp must be sent within 10 seconds
•	Dashboard must update in real-time (<3 seconds)
•	System must handle 200+ concurrent users
•	Notification delivery rate must be ≥99%
Business Rules:
•	Critical alerts: Sent via all channels, bypass quiet hours, escalate if unacknowledged
•	Warning alerts: Email + Dashboard, respect quiet hours
•	Info alerts: Dashboard only, batched for non-urgent updates
•	Alert throttling: Max 1 alert per parameter per tank every 15 minutes
•	Quiet hours respected except for critical alerts
•	Escalation hierarchy: User → Admin → Backup contacts (10-minute intervals)
•	SMS character limit: 160 characters (multiple messages if needed)
•	Email includes: Event summary, affected resource, recommended actions, dashboard link
•	WhatsApp includes: Brief details, clickable link to dashboard
•	Users can customize channel preferences per alert type
•	Alert acknowledgment tracked (manual or automatic after action taken)
•	Delivery failures logged and reported daily to Admin
Exception Handling:
•	SMS delivery failure: Retry 3 times, fall back to Email if all fail, log failure
•	Email delivery failure: Retry with exponential backoff, queue for later if persistent
•	WhatsApp service unavailable: Fall back to SMS, notify Admin
•	Invalid phone number: Mark for correction, use alternative channels
•	User opted out of notifications: Send only critical alerts, log opt-out status
•	Multiple simultaneous alerts: Batch non-critical alerts, send separately
•	Network failure: Queue notifications, deliver when connectivity restored
________________________________________
Summary
These functional requirements provide detailed specifications for the core modules of FishFarm360, covering:
1.	FR-001: User Authentication with 2FA
2.	FR-002: Role-Based Access Control
3.	FR-003: Real-Time Dashboard Aggregation
4.	FR-004: Water Quality Monitoring and Alerting
5.	FR-005: Growth Tracking and Metric Calculation
6.	FR-006: Expense Allocation and Financial Reporting
7.	FR-007: Inventory Depletion Prediction
8.	FR-008: AI Disease Diagnosis from Images
9.	FR-009: Multi-Channel Notification System
Each requirement includes comprehensive details on inputs, processes, outputs, performance expectations, business rules, and exception handling, ensuring clear guidance for development, testing, and implementation teams.

