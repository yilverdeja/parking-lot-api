# Parking Lot API

In this project, I've developed a Parking Lot API aimed at simulating a real-world parking management system. This API caters to four distinct types of users, each with specific roles and permissions:

1. **Admins:** Responsible for the management of parking lot infrastructure, including the creation and deletion of parking lots and the ability to override normal operations (force toggle).
2. **Managers:** Manage day-to-day operations and have access to detailed parking lot statistics and session data.
3. **System:** Represents automated components within the parking lot, such as entry/exit booths and occupancy sensors.
4. **End-users (Drivers):** Can view real-time data on parking lot occupancy to make informed decisions about where to park.

## Getting Started

This section guides you through setting up and running the Parking Lot API on your local machine.

### Requirements

-   **Node.js:** The project is built on Node.js, a JavaScript runtime built on Chrome's V8 JavaScript engine.
-   **MongoDB:** Uses MongoDB, a NoSQL database, to store and manage dynamic parking lot data.

Ensure you have both installed by following these links:

-   [Install Node.js](https://nodejs.org/en)
-   [Install MongoDB](https://www.mongodb.com/try)

### Set up and Running the Application

Begin by installing all necessary dependencies:

```bash
npm install
```

To launch the API server locally:

```bash
npm run start
```

This starts the server, typically listening on `http://localhost:5000`, ready to accept requests.

#### Testing

Testing is a crucial part of this project, focusing on both unit and end-to-end (e2e) tests to ensure robustness and reliability

**Run all tests** (Unit and e2e with coverage report)

```bash
npm run test
```

**Unit Tests**

Unit tests focus on individual components to ensure they perform correctly in isolation

```bash
npm run test:unit
```

**End-to-End Tests**
End-to-end tests simulate user interactions with the API to ensure all components work well together

```bash
npm run test:e2e
```

> Note: Both the Unit and E2E tests are configured to run in watch mode, meaning they will re-run automatically upon any changes to the code.

## Specifications

### Parking Lot Design

A parking lot is a business where drivers pay to park in a designated location for a certain amount of time. In this example parking lot, I'm assuming that:

-   To enter a parking lot, drivers need to check-in with their ID
-   To exit the parking lot, drivers need to use the ID they entered with. For simplicity, the payment will be calculated on check-out
-   Drivers can see how busy a parking lot is in advance before entering the parking lot
-   There are sensors in each lot that tells the system if a specific space is occupied or not
-   Parking lots have specific opening hours, costs, etc. that need to be managed by the admins

### Users

There are four main user roles that will be interacting with this API: Admins, Managers, System and End Users.

#### Admins

Admins are crucial for the backend management for the parking lot. They need to be able to:

-   Add or remove parking lots
-   Update occupancy of a lot if it's under construction or not-in-use

#### Managers

Admins have root level access, so generally on a day-to-day basis, they wouldn't be used. Managers on the other hand should be able to:

-   View all parking session information
-   View the current status of all parking lots
-   Edit parking lot information like hourly rate

#### System

Nowadays a parking lot is controlled by the parking lot system. The system can include:

-   a booth to control the entry and exit of a driver
-   sensors to detect the occupancy of a parking spot

Therefore, the system should only be able to check in drivers, check out drivers, and update the parking lot with the current occupancy and driver flow.

#### End-users / Drivers

Drivers need to interact with the system, and use the parking lots.

-   View real-time availability of parking lots
-   Access basic information about the parking lots
-   Enter and Exit from a parking lot

However, since drivers are generally anonymous, they shouldn't be able to create, delete or update anything in the database. To do so, they need to interact with the parking lot system to handle those events.

### API Endpoints

As the main focus is to develop a **simple** parking lot API, I've kept the user authentication simple. There are 3 different roles: `admin`, `manager` and `system`. To test each user, a user token is generated using the `json web token` module.

The user tokens are generated from the file found within `/src/utils/userToken.ts`. The following is the content of the file:

```typescript
import jwt from 'jsonwebtoken';

export const JWT_SECRET = '12345';

export const generateToken = (role: string) => {
	const payload = { role: role };
	return jwt.sign(payload, JWT_SECRET);
};
```

> Note: In real projects & in production, JWT_SECRET should be within the environment variables.

#### Parking Lots

-   **GET `/api/parkingLots`**

    -   **Authorization**: `admin`, `manager`
    -   **Description**: Retrieves a list of all parking lots.
    -   **Returns**: Array of parking lot objects.

-   **GET `/api/parkingLots/:id`**

    -   **Authorization**: `admin`, `manager`
    -   **Description**: Retrieves details of a specific parking lot.
    -   **Parameters**: `id` - Parking lot ID.
    -   **Returns**: Parking lot object.

-   **POST `/api/parkingLots`**

    -   **Authorization**: `admin`
    -   **Description**: Creates a new parking lot.
    -   **Body**: `{name, location, hourlyCost, capacity}`
    -   **Returns**: Newly created parking lot object.

-   **PATCH `/api/parkingLots/:id`**

    -   **Authorization**: `admin`, `manager`
    -   **Description**: Updates the hourly cost of a parking lot.
    -   **Body**: `{hourlyCost: number}`
    -   **Returns**: Updated parking lot object.

-   **DELETE `/api/parkingLots/:id`**

    -   **Authorization**: `admin`
    -   **Description**: Deletes a specific parking lot.
    -   **Parameters**: `id` - Parking lot ID.
    -   **Returns**: Status of deletion.

#### Parking Lot Spot Management

-   **GET `/api/parkingLots/:id/occupancy`**

    -   **Description**: Gets general occupancy for a parking lot.
    -   **Parameters**: `id` - Parking lot ID.
    -   **Returns**: Occupancy data.

-   **POST `/api/parkingLots/:id/lots/:lotPos/occupy`**

    -   **Authorization**: `admin`, `system`
    -   **Description**: Marks a parking spot as occupied.
    -   **Parameters**: `id` - Parking lot ID, `lotPos` - Parking spot position.
    -   **Returns**: Updated spot status.

-   **POST `/api/parkingLots/:id/lots/:lotPos/release`**

    -   **Authorization**: `admin`, `system`
    -   **Description**: Releases an occupied parking spot.
    -   **Parameters**: `id` - Parking lot ID, `lotPos` - Parking spot position.
    -   **Returns**: Updated spot status.

#### Parking Sessions

-   **GET `/api/parkingSessions`**

    -   **Authorization**: `admin`, `manager`
    -   **Description**: Retrieves all parking sessions.
    -   **Returns**: Array of parking session details.

-   **POST `/api/parkingSessions/start`**

    -   **Authorization**: `system`
    -   **Description**: Starts a parking session.
    -   **Body**: `{driverId, parkingLotId}`
    -   **Returns**: Session details including spot occupancy.

-   **POST `/api/parkingSessions/end`**

    -   **Authorization**: `system`
    -   **Description**: Ends a parking session.
    -   **Body**: `{driverId, parkingLotId}`
    -   **Returns**: Session details including spot release.

### Tech Stack

-   Written in Typescript
-   The Server and API is built with NodeJS and ExpressJS
-   The database is built on MongoDB
-   Testing is done with Jest, Supertest, and Mongodb Memory Server

## Testing

For effective testing of the application, I used a combination of [Jest](https://jestjs.io/) for overall testing, [Supertest](https://www.npmjs.com/package/supertest) for API testing, and [MongoDB Memory Server](https://www.npmjs.com/package/mongodb-memory-server) to simulate MongoDB operations without the need for actual database connections. This approach allowed me to perform integrated and unit testing more seamlessly.

### Why MongoDB Memory Server?

The MongoDB Memory Server avoids the complexities of mocking MongoDB functions. This setup allows the tests to interact with a real, and temporary MongoDB instance, ensuring that the route services behave as expected when integrated with a database.

### Testing Scenarios

There are two primary user flows: **Parking Lot Management** and **Parking Traffic Management**. These tests simulate real-world usage of our parking lot management system and are designed to ensure robustness and functionality.

#### Parking Lot Management Tests

**Objective:** Set up and configure parking lots, then manage their operational parameters.

**Procedure:**

1.  **Setup**: An `admin` creates two parking lots:
    -   **Parking Lot 1**: Capacity of 5, 4 under construction, hourly rate of $10.
    -   **Parking Lot 2**: Capacity of 7, 3 under construction, hourly rate of $12.
    -   The `admin` marks the under-construction spots as occupied.
2.  **Verification**: A `manager` retrieves and verifies the configurations of both parking lots, ensuring the accuracy of the setup.
3.  **Rate Adjustment**: The `manager` updates the hourly rate for Parking Lot 1 to $5.
4.  **Session Check**: The `manager` confirms no active parking sessions, indicating a correct initial state.

#### Parking Lot Traffic Tests

**Objective:** Simulate the flow of traffic within the parking lots, tracking the entry and movement of vehicles.

**Procedure:**

1.  **Initial Setup**: Acknowledge the existence of two previously configured parking lots.
2.  **Driver Setup**: Register two drivers:
    -   **Driver 1**: ID 1
    -   **Driver 2**: ID 2
3.  **Entry Simulation**:
    -   The `system` logs `Driver 1` entering and parking in Parking Lot 1.
    -   The `system` logs `Driver 2` entering and parking in Parking Lot 2.
4.  **Movement Simulation**: `Driver 2` changes parking spots within Parking Lot 2, with the system updating occupancy statuses accordingly.
5.  **Occupancy Verification**: The `manager` checks the parking lot status, confirming each lot has one more occupied space.
6.  **Session Management**:
    -   A duplicate entry attempt for `Driver 1` in Parking Lot 2 is rejected.
    -   `Driver 1` exits Parking Lot 1, and the session is appropriately closed.
    -   `Driver 1` then enters and exits Parking Lot 2, with the system managing the sessions correctly.
7.  **Final Check**: The `manager` reviews all sessions, noting two completed sessions for `Driver 1` and an ongoing session for `Driver 2`.

## Improvements

### API Route Testing with Live Server

Although the current testing strategy includes mocking APIs and using in-memory databases, testing with a live server running in a controlled environment could reveal issues that only occur in real-world conditions. This would involve setting up a dedicated test environment that mirrors production settings but allows for safe experimentation and testing without affecting real data.

### Enhanced Data Validation

Implementing comprehensive data validation both at the API endpoint level and within the application logic can prevent incorrect data handling and improve security. Enhancing validation checks will ensure that only valid and expected data is processed by the application, reducing potential errors and security risks.

### Better Responses

Currently, the API might provide more information than necessary in its responses, which can lead to inefficiencies and potential security risks. Streamlining these responses to include only the essential information will improve performance and enhance security. This approach also aligns with best practices for API design, focusing on providing concise, relevant data to the end-users.

### Querying Capabilities

To enhance user experience and system functionality, introducing advanced querying capabilities is essential. Allowing users to filter and search for specific information through queries will make the application more flexible and user-friendly. Implementing this feature requires updating our API endpoints to handle queries efficiently, ensuring that users can access the exact data they need without unnecessary delays or complications.
